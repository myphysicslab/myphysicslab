// Copyright 2016 Erik Neumann.  All Rights Reserved.
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

//*************************** HistoryIterator *****************************

/** Provides access to items in a {@link HistoryList}.
The iteration can start anywhere in the HistoryList. The iteration ends
with the newest value that was added to the HistoryList.
*/
export interface HistoryIterator<T> {

/** Returns the index of the current value. In a HistoryList the index starts at zero
* and increases as each value is added to the HistoryList.
* @return the index of the current value
* @throws when the index number exceeds the maximum representable integer
*/
getIndex(): number;

/** Returns the current value that this iterator points to in the HistoryList.
* @return the current value in the HistoryList
* @throws if there is no current value
*/
getValue(): T;

/** Returns `true` if there is a next value in this iteration of the HistoryList.
* @return `true` if there is a next value in this iteration
*/
hasNext(): boolean;

/** Returns `true` if there is a previous value in this iteration of the HistoryList.
* @return `true` if there is a previous value in this iteration
*/
hasPrevious(): boolean;

/** Moves to the next value in the HistoryList.
* @return the next value in the HistoryList
* @throws if there is no next value
*/
nextValue(): T;

/** Moves to the previous value in the HistoryList.
* @return the previous value in the HistoryList
* @throws if there is no previous value
*/
previousValue(): T;
}

//***************************** HistoryList *******************************

/** An ordered list of values that can be added to but not altered; older values might
be forgotten. Each value has a unique unchanging index in the HistoryList, but a
HistoryList has a limited capacity and old values will be dropped if necessary from the
HistoryList to make room for new values to be added.

HistoryList contains only those values whose index is between
{@link getStartIndex} and {@link getEndIndex} (inclusive).
The start and end index can change when writing a
new value to the list, because a new value might overwrite an old value.

The type of value stored can be number, string, boolean or any object. When using
HistoryList you can specify to the compiler the type of the value with angle brackets.
For example `HistoryList<!Vector>` indicates storing non-null Vectors in the
HistoryList.
*/
export interface HistoryList<T> {

/** Returns the index of the ending value in this HistoryList. The ending value is
the newest value in this HistoryList.
@return the index of the ending value in this HistoryList, or –1 if nothing
    has been stored
@throws when the index number exceeds the maximum representable integer
*/
getEndIndex(): number;

/** Returns the last value stored in this HistoryList, or `null` if this HistoryList is
empty.
@return the last value stored in this HistoryList, or `null` if this
    HistoryList is empty
*/
getEndValue(): T|null;

/** Returns a {@link HistoryIterator} which begins at the given index in this
HistoryList.
@param index the index to start the iterator at;  if undefined or –1, then
    starts at beginning of this HistoryList
@return a HistoryIterator which begins at the given index in this
    HistoryList.
*/
getIterator(index?: number): HistoryIterator<T>;

/** Returns the number of points currently stored in this HistoryList (which is less
than or equal to the capacity of this HistoryList).
@return the number of points currently stored in this HistoryList
*/
getSize(): number;

/** Returns the index of the starting value in this HistoryList. The starting value is
the oldest value in this HistoryList.
@return the index of the starting value in this HistoryList
@throws when the index number exceeds the maximum representable integer
*/
getStartIndex(): number;

/** Returns the value stored at the given index in this HistoryList.
@param index  the index of the value of interest
@return the value stored at the given index
@throws if the index is out of range
*/
getValue(index: number): T;

/** Clears out the memory of this HistoryList, so that there are no values stored.
The capacity of this HistoryList is unchanged.
@return {undefined}
*/
reset(): void;

/** Stores the given value into this HistoryList.
@param value the value to store
@return index within HistoryList where the value was stored
@throws when the index number exceeds the maximum representable integer
*/
store(value: T): number;
}

//**************************** CircularList ******************************

/** A circular list of values, where the next value added overwrites the oldest
value. The list is filled in until full, then it overwrites earlier entries in the list.


## How CircularList Works

This section describes how the class works internally. This information **is not
needed for using this class**.


### Index Numbers, Pointers, and Overflow

Each value added has an index number which starts at zero and increases by one with
each new value. The index number keeps increasing even when the list has
'wrapped around' and starts overwriting earlier entries.

Internally we use the term 'pointer' to mean a number in the range from 0 to the list
capacity which 'points at' a particular list entry. The pointer and index are related
and we can convert between them with the functions pointerToIndex and indexToPointer.
The relation between pointer and index is:
```text
pointer = index mod capacity
index = pointer + cycles*capacity      (when pointer < nextPtr)
      = pointer + (cycles-1)*capacity  (when pointer >= nextPtr)
```
The index number can have a maximum value of 2^53. When the index number exceeds this
maximum, an exception is thrown by methods that calculate the current index number.
Because index numbers are visible outside of this class we cannot just reset the index
number.

This 2^53 maximum value should be enough capacity for most uses of CircularList. If you
add 1000 points per second, it would take 37 million years to run out of capacity.

It might be possible to add a method that the caller can use to reset the index
numbers to start at or near zero again, preserving the data in the CircularList and
changing the index number associated with each value. Or the caller can simply make a
new CircularList when catching the exception.


### Example Scenario

We write new entries into the arrays `memX` and `memY` until they fill.
Then we wrap around and start writing to the beginning again.
```text
nextPtr always points to the next location to write to.
If size > capacity, then we have entries at 0,1,2,...,size-1
If size = capacity, then the order of entries is:
    nextPtr, nextPtr+1, ..., capacity-1, 0, 1, 2, ..., nextPtr-1

Example: Suppose capacity = 10. The list will fill in as shown below.
The numbers are the index number returned by getIndex().
The caret ^ indicates nextPtr -- the next slot to be written to.

                                cycles
.  .  .  .  .  .  .  .  .  .      0
^
0  .  .  .  .  .  .  .  .  .      0
   ^
0  1  .  .  .  .  .  .  .  .      0
      ^
(write of 2 thru 7 omitted)
0  1  2  3  4  5  6  7  8  .      0
                           ^
0  1  2  3  4  5  6  7  8  9      1
^
10 1  2  3  4  5  6  7  8  9      1
   ^
10 11 2  3  4  5  6  7  8  9      1
      ^
(write of 12 thru 16 omitted)
10 11 12 13 14 15 16 17 8  9      1
                        ^
10 11 12 13 14 15 16 17 18 9      1
                           ^
10 11 12 13 14 15 16 17 18 19     2
^
20 11 12 13 14 15 16 17 18 19     2
   ^
20 21 12 13 14 15 16 17 18 19     2
      ^
```

*/
export class CircularList<T> implements HistoryList<T> {
  /** capacity of the list, maximum size */
  private capacity_: number = 3000;
  /** number of items now in memory list <= capacity */
  private size_: number = 0;
  /** number of times the list has been overwritten */
  private cycles_: number = 0;
  /** pointer to next entry in list;  oldest entry if list has wrapped around. */
  private nextPtr_: number = 0;
  /** pointer to newest entry: index of last entry written to list or -1 if
  * never written. */
  private lastPtr_: number = -1;
  /** values stored */
  private values_: T[] = new Array(this.capacity_);
  /** last value written to memory list */
  private lastValue_: T|null = null;

/**
* @param capacity  the capacity of the list; default is 3000
*/
constructor(capacity?: number) {
  if (capacity !== undefined && capacity >1) {
    this.capacity_ = capacity;
    this.values_ = new Array(capacity);
  }
};

/** @inheritDoc */
toString() {
  return 'CircularList{capacity_: '+this.capacity_
      +', size_: '+this.size_
      +', cycles_: '+this.cycles_
      +', nextPtr_: '+this.nextPtr_
      +', lastPtr_: '+this.lastPtr_
      +'}';
};

/** Causes the MAX_INDEX_ERROR exception to occur in near future by setting
* the number of cycles to be near the maximum allowed, for testing.
*/
causeMaxIntError(): void {
  this.size_ = this.capacity_;
  this.cycles_ = Math.floor(Util.MAX_INTEGER/this.capacity_) - 1;
};

/** @inheritDoc */
getEndIndex(): number {
  if (this.size_ == 0)
    return -1;
  let idx;
  if (this.nextPtr_ == 0)
    idx = this.pointerToIndex(this.size_ - 1);
  else
    idx = this.pointerToIndex(this.nextPtr_ - 1);
  return idx;
};

/** @inheritDoc */
getEndValue() {
  const idx = this.getEndIndex();
  return idx == -1 ? null : this.values_[this.indexToPointer(idx)];
};

/** @inheritDoc */
getIterator(index?: number): HistoryIterator<T> {
  return new CircularListIterator<T>(this, index);
};

/** @inheritDoc */
getSize(): number {
  return this.size_;
};

/** @inheritDoc */
getStartIndex(): number {
  const idx = (this.size_ < this.capacity_) ? 0 : this.pointerToIndex(this.nextPtr_);
  return idx;
};

/** @inheritDoc */
getValue(index: number): T {
  const i = this.indexToPointer(index);
  return this.values_[i];
};

/** Returns the value stored at the given pointer in this HistoryList.
@param pointer  the pointer to the value of interest
@return the value stored at the given pointer
@throws if the pointer is out of range
*/
getValueAtPointer(pointer: number): T {
  return this.values_[pointer];
};

/**  Converts an index (which includes cycles) into a pointer.
* Pointer and index are the same until the list fills and 'wraps around'.
* @param index the index number, which can be larger than the size of the list
* @return the pointer to the corresponding point in the list
*/
indexToPointer(index: number): number {
  if (this.size_ < this.capacity_)
    return index;
  const p = index % this.capacity_;
  const idx = index - (this.cycles_ - (p < this.nextPtr_ ? 0 : 1)) * this.capacity_;
  return idx;
};

/**  Converts a pointer into the list to an index number that includes cycles.
* Pointer and index are the same until the list fills and 'wraps around'.
* @param pointer an index from 0 to size
* @return the index number of this point including cycles
* @throws when the index number exceeds the maximum representable integer
*/
pointerToIndex(pointer: number): number {
  if (this.size_ < this.capacity_)
    return pointer;
  const idx = pointer +
      (this.cycles_ - (pointer < this.nextPtr_ ? 0 : 1)) * this.capacity_;
  if (idx >= Util.MAX_INTEGER)
    throw CircularList.MAX_INDEX_ERROR;
  return idx;
};

/** @inheritDoc */
reset() {
  this.nextPtr_ = this.size_ = 0;  // clear out the memory
  this.cycles_ = 0;
  this.lastPtr_ = -1;
};

/** @inheritDoc */
store(value: T) {
  this.lastPtr_ = this.nextPtr_;
  this.values_[this.nextPtr_] = value;
  this.nextPtr_++;
  if (this.size_ < this.capacity_)
    this.size_++;
  if (this.nextPtr_ >= this.capacity_) {  // wrap around at end
    this.cycles_++;
    this.nextPtr_ = 0;
  }
  return this.pointerToIndex(this.lastPtr_);
};

static readonly MAX_INDEX_ERROR = 'exceeded max int';
} // end CircularList class

Util.defineGlobal('lab$util$CircularList', CircularList);

//**************************** CircularListIterator *****************************

/** Provides access to items in a {@link CircularList}.
Call {@link nextValue} to get to the first item.

To do incremental drawing, we need to know about our place in the circular
list. So we need the {@link getIndex} method to remember
where we left off during the iteration.
*/
export class CircularListIterator<T> implements HistoryIterator<T>{
  /**  Flag indicates we are at start of the iteration. */
  private first_: boolean;
  private cList_: CircularList<T>;
  private index_: number;
  private pointer_: number;

/**
@param cList the CircularList to iterate over
@param startIndex  the index to start the iteration at; undefined or -1 will
    start at oldest entry
*/
constructor(cList: CircularList<T>, startIndex?: number) {
  this.first_ = cList.getSize() > 0;
  this.cList_ = cList;
  if (startIndex === undefined || startIndex < 0) {
    startIndex = cList.getStartIndex();
  }
  // Allow making iterator on empty CircularList, but if non-empty require the starting
  // index to be in range.
  if (cList.getSize() > 0 &&
      (startIndex < cList.getStartIndex() || startIndex > cList.getEndIndex())) {
    throw 'out of range startIndex='+startIndex;
  }
  this.index_ = startIndex;
  this.pointer_ = cList.indexToPointer(startIndex);
};

/** @inheritDoc */
getIndex() {
  if (this.cList_.getSize() == 0)
    throw 'no data';
  return this.index_;
};

/** @inheritDoc */
getValue() {
  if (this.cList_.getSize() == 0)
    throw 'no data';
  return this.cList_.getValueAtPointer(this.pointer_);
};

/** @inheritDoc */
hasNext() {
  return this.first_ || this.index_ < this.cList_.getEndIndex();
};

/** @inheritDoc */
hasPrevious() {
  return this.first_ || this.index_ > this.cList_.getStartIndex();
};

/** @inheritDoc */
nextValue() {
  if (this.cList_.getSize() === 0)
    throw 'no data';
  if (this.first_) {
    // first 'nextPoint' does nothing except clear this flag
    this.first_ = false;
  } else {
    if (this.index_ + 1 > this.cList_.getEndIndex()) {
      throw 'cannot iterate past end of list';
    }
    this.index_++;
    this.pointer_ = this.cList_.indexToPointer(this.index_);
  }
  return this.cList_.getValueAtPointer(this.pointer_);
};

/** @inheritDoc */
previousValue() {
  if (this.cList_.getSize() === 0)
    throw 'no data';
  if (this.first_) {
    // first 'previousPoint' does nothing except clear this flag
    this.first_ = false;
  } else {
    if (this.index_ - 1 < this.cList_.getStartIndex()) {
      throw 'cannot iterate prior to start of list';
    }
    this.index_--;
    this.pointer_ = this.cList_.indexToPointer(this.index_);
  }
  return this.cList_.getValueAtPointer(this.pointer_);
};

} // end CircularListIterator class

Util.defineGlobal('lab$util$CircularListIterator', CircularListIterator);
