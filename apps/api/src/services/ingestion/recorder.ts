import nock from 'nock';
import path from 'path';
import fs from 'fs';

const CASSETTES_DIR = path.join(__dirname, '../../../test/cassettes');

export class Recorder {
  private mode: 'record' | 'replay' | 'live';

  constructor(mode: 'record' | 'replay' | 'live' = 'live') {
    this.mode = mode;
    if (!fs.existsSync(CASSETTES_DIR)) {
      fs.mkdirSync(CASSETTES_DIR, { recursive: true });
    }
  }

  start(name: string) {
    if (this.mode === 'replay') {
      const cassettePath = path.join(CASSETTES_DIR, `${name}.json`);
      if (fs.existsSync(cassettePath)) {
        nock.load(cassettePath);
      }
    } else if (this.mode === 'record') {
      nock.recorder.rec({
        dont_print: true,
        output_objects: true
      });
    }
  }

  stop(name: string) {
    if (this.mode === 'record') {
      const fixtures = nock.recorder.play();
      const cassettePath = path.join(CASSETTES_DIR, `${name}.json`);
      fs.writeFileSync(cassettePath, JSON.stringify(fixtures, null, 2));
      nock.recorder.clear();
      nock.restore();
    }
  }
}
