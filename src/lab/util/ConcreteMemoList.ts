// Copyright 2017 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Util } from "./Util.js";
import { Memorizable, MemoList } from "./Memo.js";

/** Concrete implementation of {@link MemoList}. */
export class ConcreteMemoList implements MemoList, Memorizable {

  private memorizables_: Memorizable[] = [];
  /** This flag helps to prevent modification of the list while iterating. */
  private isMemorizing_: boolean = false;

constructor() {};

/** @inheritDoc */
toString() {
  return 'ConcreteMemoList{'
      +'memorizables_: ['
      + this.memorizables_.map(a => a.toStringShort())
      +']}';
};

/** @inheritDoc */
toStringShort() {
  return 'ConcreteMemoList{memorizables_.length: '+this.memorizables_.length+'}';
};

/** @inheritDoc */
addMemo(memorizable: Memorizable): void {
  if (this.isMemorizing_) {
    throw 'addMemo during memorize';
  }
  if (!this.memorizables_.includes(memorizable)) {
    this.memorizables_.push(memorizable);
  }
};

/** @inheritDoc */
getMemos(): Memorizable[] {
  return Array.from(this.memorizables_);
};

/** @inheritDoc */
memorize(): void {
  try {
    this.isMemorizing_ = true;
    this.memorizables_.forEach(c => c.memorize());
  } finally {
    this.isMemorizing_ = false;
  }
};

/** @inheritDoc */
removeMemo(memorizable: Memorizable): void {
  if (this.isMemorizing_) {
    throw 'removeMemo during memorize';
  }
  Util.remove(this.memorizables_, memorizable);
};

} // end ConcreteMemoList

Util.defineGlobal('lab$util$ConcreteMemoList', ConcreteMemoList);
