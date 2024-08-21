/* eslint-disable no-console */
import { ComAtprotoSyncSubscribeRepos, lexicons } from "@atproto/api";
import { cborToLexRecord, readCar } from "@atproto/repo";
import { Subscription } from "@atproto/xrpc-server";

import { required } from "~/utils/required";

export type FirehoseOperation = {
  action: string;
  uri: string;
  cid: string;
  repo: string;
  collection: string;
  record: Record<string, unknown>;
};

type FirehoseSubscriptionBaseOptions = {
  service: string;
};

type FirehoseRunOptions = {
  reconnectDelay: number;
};

const SUBSCRIPTION_METHOD = "com.atproto.sync.subscribeRepos";

// 参考: https://github.com/bluesky-social/feed-generator/pull/90/files
export abstract class FirehoseSubscriptionBase {
  public sub: Subscription<ComAtprotoSyncSubscribeRepos.Commit>;
  private cursor: number | null = null;

  constructor({ service }: FirehoseSubscriptionBaseOptions) {
    this.sub = new Subscription({
      service: service,
      method: SUBSCRIPTION_METHOD,
      getParams: () => this.getCursor(),
      validate: (value: unknown) => {
        try {
          return lexicons.assertValidXrpcMessage<ComAtprotoSyncSubscribeRepos.Commit>(
            SUBSCRIPTION_METHOD,
            value,
          );
        } catch (err) {
          console.error("repo subscription skipped invalid message", err);
        }
      },
    });
  }

  getCursor() {
    if (this.cursor) {
      return { cursor: this.cursor };
    }
    return {};
  }

  abstract handle(
    operations: FirehoseOperation[],
    event: ComAtprotoSyncSubscribeRepos.Commit,
  ): Promise<void> | void;

  async handleEvent(event: ComAtprotoSyncSubscribeRepos.Commit) {
    if (!ComAtprotoSyncSubscribeRepos.isCommit(event)) return;
    const car = await readCar(event.blocks);
    const operations: FirehoseOperation[] = [];
    for (const op of event.ops) {
      if (!op.cid) continue;
      const recordBytes = car.blocks.get(op.cid);
      if (!recordBytes) continue;
      operations.push({
        action: op.action,
        cid: `${op.cid}`,
        uri: `at://${event.repo}/${op.path}`,
        collection: required(op.path.split("/")[0]),
        repo: event.repo,
        record: cborToLexRecord(recordBytes),
      });
    }
    return this.handle(operations, event);
  }

  async run(options: FirehoseRunOptions) {
    try {
      for await (const evt of this.sub) {
        try {
          await this.handleEvent(evt);
        } catch (e) {
          // https://github.com/bluesky-social/atproto/issues/2484
          if (
            e instanceof RangeError &&
            e.message === "Could not decode varint"
          ) {
            continue;
          }
          console.error(e);
        }
        if (ComAtprotoSyncSubscribeRepos.isCommit(evt)) {
          this.cursor = evt.seq;
        }
      }
    } catch (err) {
      console.error("repo subscription errored", err);
      setTimeout(() => this.run(options), options.reconnectDelay);
    }
  }
}
