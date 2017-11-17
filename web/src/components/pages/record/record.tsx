import * as React from 'react';
import { connect } from 'react-redux';
import ERROR_MSG from '../../../error-msg';
import API from '../../../services/api';
import Tracker from '../../../services/tracker';
import { Recordings } from '../../../stores/recordings';
import StateTree from '../../../stores/tree';
import { getItunesURL, isFocus, isNativeIOS } from '../../../utility';
import Alert from '../../alert/alert';
import Modal from '../../modal/modal';
import { FontIcon, RecordIcon } from '../../ui/icons';
import AudioIOS from './audio-ios';
import AudioWeb, { AudioInfo } from './audio-web';
import ProfileActions from './profile-actions';
import Review from './review';

const MIN_RECORDING_LENGTH = 300; // ms
const MAX_RECORDING_LENGTH = 10000; // ms
const MIN_VOLUME = 1;
const ERR_SENTENCES_NOT_LOADED =
  'Sorry! Sentences are being loaded, please wait or try again shortly.';

const UnsupportedInfo = () => (
  <div className="unsupported">
    <h2>We're sorry, but your platform is not currently supported.</h2>
    <p key="desktop">
      On desktop computers, you can download the latest:
      <a target="_blank" href="https://www.firefox.com/">
        <FontIcon type="firefox" />Firefox
      </a>{' '}
      or
      <a target="_blank" href="https://www.google.com/chrome">
        <FontIcon type="chrome" />Chrome
      </a>
    </p>
    <p key="ios">
      <b>iOS</b> users can download our free app:
    </p>
    <a target="_blank" href={getItunesURL()}>
      <img src="/img/appstore.svg" />
    </a>
  </div>
);

enum RecordingError {
  TOO_SHORT = 1,
  TOO_LONG,
  TOO_QUIET,
}

interface PropsFromState {
  api: API;
  areSentencesLoaded: boolean;
  isSetFull: boolean;
  recordingsCount: number;
  sentenceRecordings: Recordings.SentenceRecordings;
}

interface PropsFromDispatch {
  setRecording: typeof Recordings.actions.set;
}

interface RecordProps extends PropsFromState, PropsFromDispatch {
  api: API;
  isRecording: boolean;
  onRecord: Function;
  onRecordStop: Function;
  onVolume(volume: number): void;
}

interface RecordState {
  recordingStartTime: number;
  recordingStopTime: number;
  isReRecord: boolean;
  reRecordSentence?: string;
  showSubmitSuccess: boolean;
  showRetryModal: boolean;
  recordingError?: string;
}

class RecordPage extends React.Component<RecordProps, RecordState> {
  audio: AudioWeb | AudioIOS;
  isUnsupportedPlatform: boolean;
  tracker: Tracker;
  maxVolume: number;

  state: RecordState = {
    recordingStartTime: 0,
    recordingStopTime: 0,
    isReRecord: false,
    reRecordSentence: null,
    showSubmitSuccess: false,
    showRetryModal: false,
    recordingError: null,
  };

  constructor(props: RecordProps) {
    super(props);

    this.state.showSubmitSuccess = props.isSetFull;

    this.tracker = new Tracker();

    // Use different audio helpers depending on if we are web or native iOS.
    this.audio = isNativeIOS() ? new AudioIOS() : new AudioWeb();
    this.audio.setVolumeCallback(this.updateVolume.bind(this));

    if (
      !this.audio.isMicrophoneSupported() ||
      !this.audio.isAudioRecordingSupported() ||
      isFocus()
    ) {
      this.isUnsupportedPlatform = true;
      return;
    }

    this.maxVolume = 0;
  }

  private processRecording = (info: AudioInfo) => {
    const { onRecordStop, recordingsCount, sentenceRecordings } = this.props;
    onRecordStop && onRecordStop();

    const error = this.getRecordingError();
    if (error) {
      return this.setState({
        recordingError: {
          [RecordingError.TOO_SHORT]: 'The recording was too short.',
          [RecordingError.TOO_LONG]: 'The recording was too long.',
          [RecordingError.TOO_QUIET]: 'The recording was too quiet.',
        }[error],
      });
    }

    this.props.setRecording(
      this.state.reRecordSentence ||
        Object.keys(sentenceRecordings)[recordingsCount],
      info
    );

    setTimeout(() => {
      this.setState({
        isReRecord: false,
        reRecordSentence: null,
        showSubmitSuccess: this.props.isSetFull,
      });
    });

    this.tracker.trackRecord();
  };

  private getRecordingError = (): RecordingError => {
    const length = this.state.recordingStopTime - this.state.recordingStartTime;
    if (length < MIN_RECORDING_LENGTH) {
      return RecordingError.TOO_SHORT;
    }
    if (length > MAX_RECORDING_LENGTH) {
      return RecordingError.TOO_LONG;
    }
    if (this.maxVolume < MIN_VOLUME) {
      return RecordingError.TOO_QUIET;
    }
    return null;
  };

  private deleteRecording = (sentence: string): void => {
    this.setState({
      isReRecord: true,
      reRecordSentence: sentence,
      showSubmitSuccess: false,
    });

    this.props.setRecording(sentence, null);
  };

  private updateVolume = (volume: number) => {
    // For some reason, volume is always exactly 100 at the end of the
    // recording, even if it is silent; so ignore that.
    if (volume !== 100 && volume > this.maxVolume) {
      this.maxVolume = volume;
    }

    const { onVolume } = this.props;
    onVolume && onVolume(volume);
  };

  private goBack = (): void => {
    const { recordingsCount, sentenceRecordings } = this.props;

    if (recordingsCount < 1) {
      console.error('cannot undo, no recordings');
      return;
    }

    // If user was recording when going back, make sure to throw
    // out this new recording too.
    if (this.props.isRecording) {
      this.stopRecordingHard();
    }

    this.props.setRecording(
      Object.keys(sentenceRecordings)[recordingsCount - 1],
      null
    );
    this.setState({
      showSubmitSuccess: false,
    });
  };

  onRecordClick = async (evt?: any) => {
    evt.preventDefault();
    if (evt.stopImmediatePropagation) {
      evt.stopImmediatePropagation();
    }

    if (this.props.isRecording) {
      this.stopRecording();
      return;
    }

    try {
      await this.audio.init();
      this.startRecording();
    } catch (err) {
      if (err === ERROR_MSG.ERR_NO_MIC) {
        this.setState({ showRetryModal: true });
      } else {
        throw err;
      }
    }
  };

  startRecording() {
    this.audio.start();
    this.maxVolume = 0;
    this.setState({
      // TODO: re-enable display of recording time at some point.
      recordingStartTime: Date.now(),
      recordingStopTime: 0,
      showSubmitSuccess: false,
      recordingError: null,
    });
    this.props.onRecord && this.props.onRecord();
  }

  stopRecording = () => {
    this.audio.stop().then(this.processRecording);
    this.setState({
      recordingStopTime: Date.now(),
    });
  };

  /**
   * Stop the current recording and throw out the audio.
   */
  stopRecordingHard = () => {
    this.audio.stop();
    this.props.onRecordStop && this.props.onRecordStop();
  };

  private closeRetryModal = () => {
    this.setState({ showRetryModal: false });
  };

  private closeSubmitSuccess = () => {
    this.setState({
      showSubmitSuccess: false,
    });
  };

  private clearRecordingError = () => {
    this.setState({ recordingError: null });
  };

  render() {
    if (this.isUnsupportedPlatform) {
      return <UnsupportedInfo />;
    }

    if (this.props.isSetFull) {
      return (
        <div id="record-container">
          <Review
            onRedo={this.deleteRecording}
            match={null}
            location={null}
            history={null}
          />
        </div>
      );
    }

    const {
      areSentencesLoaded,
      recordingsCount,
      sentenceRecordings,
    } = this.props;
    const {
      isReRecord,
      recordingError,
      reRecordSentence,
      showRetryModal,
      showSubmitSuccess,
    } = this.state;
    const recordIndex = isReRecord
      ? Object.keys(sentenceRecordings).indexOf(reRecordSentence)
      : recordingsCount;

    return (
      <div id="record-container">
        {showRetryModal && (
          <Modal
            onRequestClose={this.closeRetryModal}
            buttons={{
              Cancel: this.closeRetryModal,
              Retry: () => window.location.reload(),
            }}>
            You must allow microphone access.
          </Modal>
        )}
        <div id="voice-record">
          {recordingError && (
            <div id="alert-container">
              <Alert autoHide type="error" onClose={this.clearRecordingError}>
                {recordingError}
              </Alert>
            </div>
          )}
          {showSubmitSuccess && (
            <div id="alert-container">
              <Alert autoHide onClose={this.closeSubmitSuccess}>
                Submit success! Want to record again?
              </Alert>
            </div>
          )}
          <div className="record-sentence">
            {Object.keys(sentenceRecordings).map((sentence, i) => (
              <p
                key={sentence + '' + i}
                className={
                  'text-box ' +
                  (i < recordIndex ? 'left' : i > recordIndex ? 'right' : '')
                }>
                {sentence}
              </p>
            ))}
            {recordingsCount > 0 &&
              !isReRecord && (
                <FontIcon id="undo-clip" type="undo" onClick={this.goBack} />
              )}
          </div>

          <div className="record-controls">
            {areSentencesLoaded
              ? [
                  <p key="record-help" id="record-help">
                    Please tap to record, then read the above sentence aloud.
                  </p>,
                  <button
                    key="record-button"
                    id="record-button"
                    onTouchStart={this.onRecordClick}
                    onClick={this.onRecordClick}>
                    <RecordIcon />
                  </button>,
                ]
              : ERR_SENTENCES_NOT_LOADED}
          </div>
          <p id="recordings-count">
            {!isReRecord && <span>{recordingsCount + 1} of 3</span>}
          </p>
          <ProfileActions />
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ api, recordings }: StateTree) => ({
  api,
  areSentencesLoaded: Recordings.selectors.areEnoughSentencesLoaded(recordings),
  isSetFull: Recordings.selectors.isSetFull(recordings),
  recordingsCount: Recordings.selectors.recordingsCount(recordings),
  sentenceRecordings: recordings.sentenceRecordings,
});

const mapDispatchToProps = {
  setRecording: Recordings.actions.set,
};

export default connect<PropsFromState, PropsFromDispatch>(
  mapStateToProps,
  mapDispatchToProps
)(RecordPage);
