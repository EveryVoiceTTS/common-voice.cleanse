import { IConnection } from 'mysql2Types';
import { fetchS3Data } from './fetch-s3-data';
import { migrateClip } from './migrate-clip';
import { migrateSentences } from './migrate-sentences';
import { migrateVote } from './migrate-vote';
import { migrateUserClient } from './migrate-user-client';

function print(...args: any[]) {
  args.unshift('MIGRATION --');
  console.log.apply(console, args);
}

(<any>Symbol).asyncIterator =
  Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator');

export async function migrate(connection: IConnection) {
  print('starting');

  try {
    await migrateSentences(connection, print);

    const gen = fetchS3Data(print);

    const votesWithUnknownClips = [];
    let processedObjectsCount = 0;
    let result;
    while ((result = await gen.next()) && !result.done) {
      processedObjectsCount++;
      const { type } = result.value;
      if (type === 'clip') {
        const clip = result.value;
        await migrateUserClient(connection, clip.client_id);
        await migrateClip(connection, clip, print);
      } else if (type === 'vote') {
        const vote = result.value;
        await migrateUserClient(connection, vote.clip_client_id);
        await migrateUserClient(connection, vote.voter_client_id);
        if (!await migrateVote(connection, vote, print)) {
          votesWithUnknownClips.push(vote);
        }
      }

      if (processedObjectsCount % 100 == 0) {
        print('processed', processedObjectsCount, 'objects from S3');
      }
    }
    const [[row]] = await connection.execute(
      'SELECT ' +
        '(SELECT COUNT(*) FROM sentences) AS sentencesCount,' +
        '(SELECT COUNT(*) FROM user_clients) AS userClientsCount,' +
        '(SELECT COUNT(*) FROM clips) AS clipsCount,' +
        '(SELECT COUNT(*) FROM votes) AS votesCount'
    );
    print(JSON.stringify(row));
    if (votesWithUnknownClips.length > 0) {
      print(
        votesWithUnknownClips.length,
        'votes with unknown clip. It will NOT be migrated:',
        JSON.stringify(votesWithUnknownClips)
      );
    }
    print('done!!!!!');
  } catch (e) {
    console.error(e);
    print('failed');
  }
}
