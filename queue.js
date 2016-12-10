/**
 *  Queue 
 * 
 *  {
 *      "index":xx,
 *      "status":"",
 *      "queue": []
 *  }
 */
const fs = require('fs');

function QueueFullError () {
    var errObj = Error.call(this, "Queue is full");
    errObj.name = this.name = 'QueueFullError';
    this.message = errObj.message;

    // not necessary
    // Object.defineProperty(this, 'stack', {
    //     get: function () {
    //         return errObj.stack;
    //     }
    // });

    return this;
}

QueueFullError.prototype.__proto__ = Error.prototype;
QueueFullError.prototype.constructor = QueueFullError;

function Queue() {
    var limit = -1; // hard code limit

    var indexPush = 0;
    var indexPop = 0;

    var count = 0;

    // public 
    this.queue = [];

    /**
     * Check if the queue full
     */

    this.isfull = function (/*type*/) {
        if (limit === -1)
            return false;
        return count >= limit;
    };

    /**
     * Return size of the queue
     */

    this.size = function (/*type*/) {
        if (limit >= 0)
            return count;
        return this.queue.length;
    };

    /**
     * Return the bottom of the queue
     */

    this.bottom = function () {
        var index;
        if (limit >= 0 ) {
            index = (indexPop);
        }
        else {
            index = this.queue.length - 1;
        }
        return this.get(index);
    };

    /**
     * push the item in the queue
     */

    this.push = function (item) {
        if (limit >= 0 ) {
            if (count >= limit) {
                throw new QueueFullError();
            }

            queue[indexPush] = item;

            var index = indexPush;
            if (limit > 0) {
                indexPush = (indexPush + 1) % limit;
            }
            else {
                indexPush += 1; 
            }
            ++count;
            return index;
        }
        this.queue.push(item);
        return this.queue.length - 1;
    };

    /**
     * Pop
     */

    this.pop = function () {
        var item = null;

        if (limit >= 0) {
            if (count > 0) {
                var index;
                while (!item) {
                    index = indexPop;
                    item = queue[indexPop];
                    indexPop = (indexPop + 1) % limit;
                }

                queue[index] = null;
                --count;
            }
        }
        else {
            item = this.queue.shift();
        }
        return item;
    };

    /**
     * remove item
     */

    this.delete = function (index/*, type*/) {
        queue[index] = null;
        --count;
    };

    /**
     * get the item with index
     */

    this.get = function (index) {
        return queue[index];
    };

    /**
     * 
     */

    this.throwQueueFullError = function () {
        throw new QueueFullError();
    };

    /**
     * 
     */

    this.serialize = function (filename) {
        var obj = {queue:queue};
        fs.writeFileSync(filename, JSON.stringify(obj));
    };

    /**
     * 
     */

    this.deserialize = function (filename) {
        var data = fs.readFileSync(filename, "utf8");

        var obj = JSON.parse(data);
        this.queue = obj.queue;
        if (obj.index) {
            var count = obj.index;
            while (count > 0) {
                this.pop();
                --count;
            }
        }
    };

    /**
     * Shift
     */

    this.shift = function () {
        return this.queue.shift();
    };
}

/**
 * module
 */

module.exports = Queue;
