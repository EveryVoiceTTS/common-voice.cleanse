import { pick } from 'lodash';
import { CommonVoiceConfig } from '../../config-helper';
import Mysql from './db/mysql';
import Schema from './db/schema';
import Table from './db/table';
import { UpdatableUserFields, UserTable } from './db/tables/user-table';
import UserClientTable from './db/tables/user-client-table';
import VersionTable from './db/tables/version-table';
import ClipTable from './db/tables/clips-table';
import SentenceTable from './db/tables/sentences-table';
import VoteTable from './db/tables/votes-table';

export type Tables = Table[];

export default class DB {
  clip: ClipTable;
  config: CommonVoiceConfig;
  currentVersion: number;
  mysql: Mysql;
  sentence: SentenceTable;
  schema: Schema;
  tables: Tables;
  user: UserTable;
  userClient: UserClientTable;
  version: VersionTable;
  vote: VoteTable;

  constructor(config: CommonVoiceConfig) {
    this.config = config;
    this.currentVersion = config.VERSION;
    this.mysql = new Mysql(this.config);

    this.clip = new ClipTable(this.mysql);
    this.sentence = new SentenceTable(this.mysql);
    this.user = new UserTable(this.mysql);
    this.userClient = new UserClientTable(this.mysql);
    this.version = new VersionTable(this.mysql, this.currentVersion);
    this.vote = new VoteTable(this.mysql);

    this.tables = [
      this.clip,
      this.sentence,
      this.user,
      this.userClient,
      this.version,
      this.vote,
    ];

    this.schema = new Schema(this.mysql, this.tables, this.version);
  }

  /**
   * Normalize email address as input.
   * TODO: add validation here.
   */
  private formatEmail(email?: string): string {
    if (!email) {
      return '';
    }

    return email.toLowerCase();
  }

  /**
   * Insert or update user client row.
   */
  async updateUser(
    clientId: string,
    fields: UpdatableUserFields
  ): Promise<void> {
    let { email } = fields;
    if (email) email = this.formatEmail(email);
    await Promise.all([
      this.user.update({
        email,
        ...pick(fields, 'send_emails', 'has_downloaded'),
      }),
      this.userClient.update(clientId, email),
    ]);
  }

  /**
   * Ensure the database is setup.
   */
  async ensureSetup(): Promise<void> {
    return this.schema.ensure();
  }

  /**
   * I hope you know what you're doing.
   */
  async drop(): Promise<void> {
    return this.schema.dropDatabase();
  }

  /**
   * Print the current count of users in db.
   */
  async getUserCount(): Promise<number> {
    return this.user.getCount();
  }

  /**
   * Make sure we have a fully updated schema.
   */
  async ensureLatest(): Promise<void> {
    await this.ensureSetup();
    let version;

    try {
      version = await this.version.getCurrentVersion();
    } catch (err) {
      console.error('error fetching version', err);
      version = 0;
    }

    await this.schema.upgrade(version);
  }

  /**
   * End connection to the database.
   */
  endConnection(): void {
    this.mysql.endConnection();
  }
}
