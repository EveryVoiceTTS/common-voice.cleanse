import * as http from 'http';
import Files from './files';
import { getFileExt } from './utility';

const ms = require('mediaserver');
const path = require('path');
const ff = require('ff');
const fs = require('fs');
const crypto = require('crypto');
const Promise = require('bluebird');
const mkdirp = require('mkdirp');
const findRemoveSync = require('find-remove');
const AWS = require('./aws');
const PassThrough = require('stream').PassThrough;
const Transcoder = require('stream-transcoder');

const UPLOAD_PATH = path.resolve(__dirname, '../..', 'upload');
const CONFIG_PATH = path.resolve(__dirname, '../../..', 'config.json');
const ACCEPTED_EXT = [ '.mp3', '.ogg', '.webm', '.m4a' ];
const DEFAULT_SALT = '8hd3e8sddFSdfj';
const config = require(CONFIG_PATH);
const salt = config.salt || DEFAULT_SALT;
const BUCKET_NAME = config.BUCKET_NAME || 'common-voice-corpus';

/**
 * Clip - Responsibly for saving and serving clips.
 */
export default class Clip {
  private s3: any;
  private files: Files;

  constructor() {
    this.s3 = new AWS.S3();
    this.files = new Files();
    setInterval(findRemoveSync.bind(this, UPLOAD_PATH, {age: {seconds: 300}, extensions: '.mp3'}), 300000);
  }

  /**
   * Returns the file path with extension stripped.
   */
  private getGlob(path: string): string {
    return path.substr(0, path.indexOf('.'));
  }

  private hash(str: string): string {
    return crypto.createHmac('sha256', salt).update(str).digest('hex');
  }

  private streamAudio(request: http.IncomingMessage,
                      response: http.ServerResponse,
                      key: string): void {
    // Save the data locally, stream to client, remove local data (Performance?)
    let tmpFilePath = path.join(UPLOAD_PATH, key);
    let tmpFileDirectory = path.dirname(tmpFilePath);
    let f = ff(() => {
      mkdirp(tmpFileDirectory, f.wait());
    }, () => {
      let retrieveParam = {Bucket: BUCKET_NAME, Key: key};
      let awsResult = this.s3.getObject(retrieveParam);
      f.pass(awsResult);
    }, (awsResult) => {
      let tmpFile = fs.createWriteStream(tmpFilePath);
      tmpFile = awsResult.createReadStream().pipe(tmpFile);
      tmpFile.on('finish', f.wait());
    }, () => {
      ms.pipe(request, response, tmpFilePath);
    });
  }

  /**
   * Turn a server url into a S3 file path.
   */
  private getS3FilePath(url: string): string {
    let parts = url.split('/');
    let fileName = parts.pop();
    let folder = parts.pop();
    return folder + '/' + fileName;
  }

  /**
   * Is this request directed at voice clips?
   */
  isClipRequest(request: http.IncomingMessage) {
    return request.url.includes('/upload/');
  }

  /**
   * Is this request directed at a random voice clip?
   */
  isRandomClipRequest(request: http.IncomingMessage) {
    return request.url.includes('/upload/random');
  }

  /**
   * Is this request to vote on a voice clip?
   */
  isClipVoteRequest(request: http.IncomingMessage) {
    return request.url.includes('/upload/vote');
  }


  /**
   * Distinguish between uploading and listening requests.
   */
  handleRequest(request: http.IncomingMessage,
                response: http.ServerResponse): void {
    if (request.method === 'POST') {
      if (this.isClipVoteRequest(request)) {   // Note: Check must occur first
        this.saveClipVote(request, response);
      } else {
        this.saveClip(request, response);
      }
    } else if (this.isRandomClipRequest(request)) {
      this.serveRandomClip(request, response);
    } else {
      this.serve(request, response);
    }
  }

  /**
   * Save clip vote posted to server
   */
  saveClipVote(request: http.IncomingMessage,
                  response: http.ServerResponse) {
      this.saveVote(request).then(timestamp => {
        response.writeHead(200);
        response.end('' + timestamp);
      }).catch(e => {
        response.writeHead(500);
        console.error('saving clip vote error', e, e.stack);
        response.end('Error');
      });
  }

  /**
   * Save the request clip vote in S3
   */
  saveVote(request: http.IncomingMessage): Promise<string> {
    let uid = request.headers.uid;
    let glob = request.headers.glob;
    let vote = decodeURI(request.headers.vote as string);

    return new Promise((resolve: Function, reject: Function) => {
      // Where is the clip vote going to be located?
      let voteFile = glob + '-by-' + uid + '.vote';

      let f = ff(() => {

        // Save vote to S3
        let params = {Bucket: BUCKET_NAME, Key: voteFile, Body: vote};
        this.s3.putObject(params, f());
      }, () => {

        // File saving is now complete.
        console.log('clip vote written to s3', voteFile);
        resolve(glob);
      }).onError(reject);
    });
  }

  /**
   * Save clip posted to server
   */
  saveClip(request: http.IncomingMessage,
                  response: http.ServerResponse) {
      this.save(request).then(timestamp => {
        response.writeHead(200);
        response.end('' + timestamp);
      }).catch(e => {
        response.writeHead(500);
        console.error('saving clip error', e, e.stack);
        response.end('Error');
      });
  }

  /**
   * Save the request body as an audio file.
   */
  save(request: http.IncomingMessage): Promise<string> {
    let info = request.headers;
    let uid = info.uid;
    let sentence = decodeURI(info.sentence as string);

    return new Promise((resolve: Function, reject: Function) => {
      // Obtain contentType
      let contentType = info['content-type'] as string;

      // Where is our audio clip going to be located?
      let folder = uid + '/';
      let filePrefix = this.hash(sentence);
      let file = folder + filePrefix + '.mp3';
      let txtFile = folder + filePrefix + '.txt';

      let f = ff(() => {

        // if the folder does not exist, we create it
        let params = {Bucket: BUCKET_NAME, Key: folder};
        this.s3.putObject(params, f.wait());

        // If we were given base64, we'll need to concat it all first
        // So we can decode it in the next step.
        if (contentType.includes('base64')) {
          let chunks = [];
          f.pass(chunks);
          request.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          request.on('end', f.wait());
        }
      }, (chunks) => {

        // If upload was base64, make sure we decode it first.
        if (contentType.includes('base64')) {
          let passThrough = new PassThrough();
          passThrough.end(Buffer.from(Buffer.concat(chunks).toString(), 'base64'));
          let transcoder = new Transcoder(passThrough);
          transcoder = transcoder.audioCodec('mp3').format('mp3');
          let transcoderStream = transcoder.stream();
          let params = {Bucket: BUCKET_NAME, Key: file, Body: transcoderStream};
          this.s3.upload(params, f());
        } else {
          // For now base64 uploads, we can just stream data.
          let transcoder = new Transcoder(request);
          transcoder = transcoder.audioCodec('mp3').format('mp3');
          let transcoderStream = transcoder.stream();
          let params = {Bucket: BUCKET_NAME, Key: file, Body: transcoderStream};
          this.s3.upload(params, f());
        }

        // Don't forget about the sentence text!
        let params = {Bucket: BUCKET_NAME, Key: txtFile, Body: sentence};
        this.s3.putObject(params, f());
      }, () => {

        // File saving is now complete.
        console.log('file written to s3', file);
        resolve(filePrefix);
      }).onError(reject);
    });
  }

  /**
   * Fetch random clip file and associated sentence.
   */
  serveRandomClip(request: http.IncomingMessage,
                  response: http.ServerResponse) {
    let uid = request.headers.uid as string;

    this.files.getRandomClip(uid).then((clip: string[2]) => {
      if (!clip) {
      }

      // Get full key to the file.
      let key = clip[0];
      let sentence = clip[1]

      // Send sentence + glob strings to client in the header.
      // Note: header is already URL encoded in the file.
      response.setHeader('sentence', sentence);
      response.setHeader('glob', this.getGlob(key));


      // Stream audio to client
      this.streamAudio(request, response, key);
    }).catch(err => {
      console.error('problem getting a random clip: ', err);
      response.writeHead(500);
      response.end('Cannot fetch random clip right now.');
      return;
    });
  }

  /*
   * Fetch an audio file.
   */
  serve(request: http.IncomingMessage, response: http.ServerResponse) {
    let prefix = this.getS3FilePath(request.url);

    let searchParam = {Bucket: BUCKET_NAME, Prefix: prefix};
    this.s3.listObjectsV2(searchParam, (err: any, data: any) => {
      if (err) {
        console.error('Did not find specified clip', err);
        response.writeHead(404);
        response.end('Unknown File');
        return;
      }

      // Try to find the right key, since we don't know the extension.
      let key = null;
      for (let i = 0; i < data.Contents.length; i++) {
        let ext = getFileExt(data.Contents[i].Key);
        if (ACCEPTED_EXT.indexOf(ext) !== -1) {
          key = data.Contents[i].Key;
          break;
        }
      }

      if (!key) {
        console.error('could not find clip', data.Contents);
        response.writeHead(404);
        response.end('Unknown File');
        return;
      }

      // Stream audio to client
      this.streamAudio(request, response, key);
    });
  }
}
