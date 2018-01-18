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

goog.provide('myphysicslab.lab.util.CircularList');
goog.provide('myphysicslab.lab.util.CircularListIterator');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.util.HistoryList');
goog.require('myphysicslab.lab.util.HistoryIterator');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var HistoryList = myphysicslab.lab.util.HistoryList;
const HistoryIterator = goog.module.get('myphysicslab.lab.util.HistoryIterator');
const Util = goog.module.get('myphysicslab.lab.util.Util');

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

    pointer = index mod capacity
    index = pointer + cycles*capacity      (when pointer < nextPtr)
          = pointer + (cycles-1)*capacity  (when pointer >= nextPtr)

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


* @param {number=} capacity  the capacity of the list; default is 3000
* @template T
* @implements HistoryList<T>
* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.CircularList = function(capacity) {
  /** capacity of the list, maximum size
  * @type {number}
  * @private
  */
  this.capacity_ = capacity || 3000;
  if (this.capacity_ < 2) {
    throw new Error();
  }
  /** number of items now in memory list <= capacity
  * @type {number}
  * @private
  */
  this.size_ = 0;
  /** number of times the list has been overwritten
  * @type {number}
  * @private
  */
  this.cycles_ = 0;
  /** pointer to next entry in list;  oldest entry if list has wrapped around.
  * @type {number}
  * @private
  */
  this.nextPtr_ = 0;
  /** pointer to newest entry: index of last entry written to list or -1 if
  * never written.
  * @type {number}
  * @private
  */
  this.lastPtr_ = -1;
  /** values stored
  * @type {!Array<T>}
  * @private
  */
  this.values_ = new Array(this.capacity_);
  /** last value written to memory list
  * @type {?T}
  * @private
  */
  this.lastValue_ = null;
};
var CircularList = myphysicslab.lab.util.CircularList;

/** @override */
CircularList.prototype.toString = function() {
  return Util.ADVANCED ? '' : 'CircularList{capacity_: '+this.capacity_
      +', size_: '+this.size_
      +', cycles_: '+this.cycles_
      +', nextPtr_: '+this.nextPtr_
      +', lastPtr_: '+this.lastPtr_
      +'}';
};

/**
* @type {string}
* @const
*/
CircularList.MAX_INDEX_ERROR = 'exceeded max int';

/** Causes the MAX_INDEX_ERROR exception to occur in near future by setting
* the number of cycles to be near the maximum allowed, for testing.
* @return {undefined}
*/
CircularList.prototype.causeMaxIntError = function() {
  this.size_ = this.capacity_;
  this.cycles_ = Math.floor(Util.MAX_INTEGER/this.capacity_) - 1;
};

/** @override */
CircularList.prototype.getEndIndex = function() {
  if (this.size_ == 0)
    return -1;
  var idx;
  if (this.nextPtr_ == 0)
    idx = this.pointerToIndex(this.size_ - 1);
  else
    idx = this.pointerToIndex(this.nextPtr_ - 1);
  return idx;
};

/** @override */
CircularList.prototype.getEndValue = function() {
  var idx = this.getEndIndex();
  return idx == -1 ? null : this.values_[this.indexToPointer(idx)];
};

/** @override */
CircularList.prototype.getIterator = function(index) {
  return new CircularListIterator(this, index);
};

/** @override */
CircularList.prototype.getSize = function() {
  return this.size_;
};

/** @override */
CircularList.prototype.getStartIndex = function() {
  var idx = (this.size_ < this.capacity_) ? 0 : this.pointerToIndex(this.nextPtr_);
  return idx;
};

/** @override */
CircularList.prototype.getValue = function(index) {
  var i = this.indexToPointer(index);
  return this.values_[i];
};

/**  Converts an index (which includes cycles) into a pointer.
Pointer and index are the same until the list fills and 'wraps around'.
* @param {number} index the index number, which can be larger than the size of the list
* @return {number} the pointer to the corresponding point in the list
* @private
*/
CircularList.prototype.indexToPointer = function(index) {
  if (this.size_ < this.capacity_)
    return index;
  var p = index % this.capacity_;
  var idx = index - (this.cycles_ - (p < this.nextPtr_ ? 0 : 1)) * this.capacity_;
  return idx;
};

/**  Converts a pointer into the list to an index number that includes cycles.
Pointer and index are the same until the list fills and 'wraps around'.
* @throws {!Error} when the index number exceeds the maximum representable integer
* @param {number} pointer an index from 0 to size
* @return {number} the index number of this point including cycles
* @private
*/
CircularList.prototype.pointerToIndex = function(pointer) {
  if (this.size_ < this.capacity_)
    return pointer;
  var idx = pointer +
      (this.cycles_ - (pointer < this.nextPtr_ ? 0 : 1)) * this.capacity_;
  if (idx >= Util.MAX_INTEGER)
    throw new Error(CircularList.MAX_INDEX_ERROR);
  return idx;
};

/** @override */
CircularList.prototype.reset = function() {
  this.nextPtr_ = this.size_ = 0;  // clear out the memory
  this.cycles_ = 0;
  this.lastPtr_ = -1;
};

/** @override */
CircularList.prototype.store = function(value) {
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

/** Provides access to items in a {@link CircularList}.
Call {@link #nextValue} to get to the first item.

Also, to do incremental drawing, we need to know about our place in the circular
list. So we need the {@link #getIndex} method to remember where we left off during the
iteration.

Note about private variables:  with Google Closure Compiler, a variable marked
private can be accessed from any code in the file where it is defined.

@param {!CircularList<T>} cList the CircularList to iterate over
@param {number=} startIndex  the index to start the iteration at; undefined or -1 will
    start at oldest entry
@constructor
@final
@struct
@template T
@implements {HistoryIterator<T>}
@private
*/
myphysicslab.lab.util.CircularListIterator = function(cList, startIndex) {
  /**  Flag indicates we are at start of the iteration.
  * @type {boolean}
  * @private
  */
  this.first_ = cList.size_ > 0;
  /**
  * @type {!CircularList}
  * @private
  */
  this.cList_ = cList;
  if (startIndex === undefined || startIndex < 0) {
    startIndex = cList.getStartIndex();
  }
  // Allow making iterator on empty CircularList, but if non-empty require the starting
  // index to be in range.
  if (cList.size_ > 0 &&
      (startIndex < cList.getStartIndex() || startIndex > cList.getEndIndex())) {
    throw new Error('out of range startIndex='+startIndex);
  }
  /**
  * @type {number}
  * @private
  */
  this.index_ = startIndex;
  /**
  * @type {number}
  * @private
  */
  this.pointer_ = cList.indexToPointer(startIndex);
};
var CircularListIterator = myphysicslab.lab.util.CircularListIterator;

/** @override */
CircularListIterator.prototype.getIndex = function() {
  if (this.cList_.size_ == 0)
    throw new Error('no data');
  return this.index_;
};

/** @override */
CircularListIterator.prototype.getValue = function() {
  if (this.cList_.size_ == 0)
    throw new Error('no data');
  return this.cList_.values_[this.pointer_];
};

/** @override */
CircularListIterator.prototype.hasNext = function() {
  return this.first_ || this.index_ < this.cList_.getEndIndex();
};

/** @override */
CircularListIterator.prototype.hasPrevious = function() {
  return this.first_ || this.index_ > this.cList_.getStartIndex();
};

/** @override */
CircularListIterator.prototype.nextValue = function() {
  if (this.cList_.size_ === 0)
    throw new Error('no data');
  if (this.first_) {
    // first 'nextPoint' does nothing except clear this flag
    this.first_ = false;
  } else {
    if (this.index_ + 1 > this.cList_.getEndIndex()) {
      throw new Error('cannot iterate past end of list');
    }
    this.index_++;
    this.pointer_ = this.cList_.indexToPointer(this.index_);
  }
  return this.cList_.values_[this.pointer_];
};

/** @override */
CircularListIterator.prototype.previousValue = function() {
  if (this.cList_.size_ === 0)
    throw new Error('no data');
  if (this.first_) {
    // first 'previousPoint' does nothing except clear this flag
    this.first_ = false;
  } else {
    if (this.index_ - 1 < this.cList_.getStartIndex()) {
      throw new Error('cannot iterate prior to start of list');
    }
    this.index_--;
    this.pointer_ = this.cList_.indexToPointer(this.index_);
  }
  return this.cList_.values_[this.pointer_];
};

}); // goog.scope
