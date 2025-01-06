/**
 * パラメータで指定された文字列から、末尾一文字を削除します。(絵文字&サロゲート文字対応)
 */  
class EmojiUtil extends EmojiBase{

    /**
     * コンストラクタ
     */
    constructor() {
        super();
    }

    /**
     * @description 初期化処理を行います。
     * @param {string} emojiSequenceDef 末尾一文字を削除する文字列 
     */
    initialize(emojiSequenceDef) {
        // 絵文字用のキャッシュを生成する。
        for (var i = 0; i < emojiSequenceDef.length; i++) {
            var sequence = emojiSequenceDef[i];
            var cacheNode = this.emojiSequenceCache.find(e => e.length == sequence.length );
            if (cacheNode === undefined) {
                cacheNode = new Object();
                cacheNode.length = sequence.length;
                cacheNode.sequence = [];
                this.emojiSequenceCache.push(cacheNode);
            }
            cacheNode.sequence.push(sequence);
        }

        // lengthの降順でソートしておく。
        this.emojiSequenceCache.sort((a, b) => b.length - a.length);
    }

    /**
     * @description パラメータで指定された文字列から、末尾一文字以外の文字列と末尾一文字に分割します。(絵文字&サロゲート文字対応)
     * @param value 末尾一文字を分割する文字列
     * @returns {Object} 末尾一文字以外の文字列と末尾一文字
     */
    _splitLastOneCharacter(value) {
        // 文字列ではないもしくは空文字の場合、
        if (value.length == 0) {
            // 戻り値を設定し処理を終了する。
            return {
                lastOneCharRemovedString: [],
                lastOneChar: ''
            };
        }

        // コードポイント単位で文字列を分割する。
        var codePointUnitCharArray = value;
        if (typeof value === 'string') {
            codePointUnitCharArray = Array.of(...value);
        }

        // 1文字の場合、
        if (codePointUnitCharArray.length == 1) {
            // 戻り値を設定し処理を終了する。
            return {
                lastOneCharRemovedString: [],
                lastOneChar: codePointUnitCharArray[0]
            };
        }

        // 文字列をコードポイントに変換する。
        var codePointUnitCharArrayIndex = 0;
        var codePointArray = [];
        while (codePointUnitCharArrayIndex < codePointUnitCharArray.length) {
            codePointArray.push(codePointUnitCharArray[codePointUnitCharArrayIndex].codePointAt(0));
            codePointUnitCharArrayIndex = (codePointUnitCharArrayIndex + 1) | 0;
        }

        // 絵文字キャッシュ分ループする。
        var codePointMatchCount = 1;
        var emojiChacheIndex = 0;
        var cacheNode = {};
        var emojiSequenceIndex = 0;
        var emojiCodePoints = [];
        var tempCodePointMatchCount = 0;
        var codePointIndex = 0;
        var hasEmoji = false;
        while (emojiChacheIndex < this.emojiSequenceCache.length && !hasEmoji) {
            cacheNode = this.emojiSequenceCache[emojiChacheIndex];
            if (codePointArray.length < cacheNode.length) {
                emojiChacheIndex = (emojiChacheIndex + 1) | 0;
                continue;
            }

            // 絵文字シーケンス分ループする。
            emojiSequenceIndex = 0;
            while (emojiSequenceIndex < cacheNode.sequence.length && !hasEmoji) {
                emojiCodePoints = cacheNode.sequence[emojiSequenceIndex];

                // 絵文字シーケンスのコードポイント分ループする。
                tempCodePointMatchCount = 0;
                codePointIndex = 0;
                while (codePointIndex < cacheNode.length) {
                    // コードポイントがマッチした場合、
                    if (emojiCodePoints[codePointIndex] == codePointArray[codePointArray.length - cacheNode.length + codePointIndex]) {
                        // マッチしたコードポイント数をインクリメントする。
                        tempCodePointMatchCount = (tempCodePointMatchCount + 1) | 0;
                    }
                    codePointIndex = (codePointIndex + 1) | 0;
                }

                // 絵文字シーケンスのコードポイント数と
                // パラメータの文字列でマッチしたコードポイント数が同じ場合、
                if (tempCodePointMatchCount == cacheNode.length) {
                    // 絵文字と判定する。
                    codePointMatchCount = tempCodePointMatchCount;
                    hasEmoji = true;
                    break;
                }
                emojiSequenceIndex = (emojiSequenceIndex + 1) | 0;
            }

            // インデクサをインクリメントする。
            emojiChacheIndex = (emojiChacheIndex + 1) | 0;
        }

        // 戻り値を設定する。
        var lastOneCharRemovedString = codePointUnitCharArray.slice(
            0,
            codePointUnitCharArray.length - codePointMatchCount);
        var lastOneChar = codePointUnitCharArray.splice(
            codePointUnitCharArray.length - codePointMatchCount,
            codePointMatchCount).join('');
        return {
            lastOneCharRemovedString: lastOneCharRemovedString,
            lastOneChar: lastOneChar
        };
    }

    /**
     * パラメータの値が、String型かチェックします。
     * @param {Object} obj 
     * @return {string} チェック結果--true：String型；false：String型ではない
     */
    isString(obj) {
        return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() == 'string';
    }

    /**
     * @description パラメータで指定された文字列から、末尾一文字を削除します。(絵文字&サロゲート文字対応)
     * @param {string} value 末尾一文字を削除する文字列
     * @return {string} 末尾一文字削除後の文字列
     */
    delOneCharacter(value) {
        if (typeof value === "undefined") {
            return undefined;
        } else if (!this.isString(value)) {
            return '';
        }
        return this._splitLastOneCharacter(value).lastOneCharRemovedString.join('');
    }

    /**
     * @description パラメータで指定された文字列を1文字単位に分割します。(絵文字&サロゲート文字対応)
     * @param {string} value 末尾一文字を削除する文字列
     * @return {Array} 分割結果
     */
    toArray(value) {
        if (typeof value === "undefined") {
            return undefined;
        } else if (!this.isString(value)) {
            return [];
        }
        var result = [];
        var tmp = {
            lastOneCharRemovedString: value,
            lastOneChar: ''
        };
        do {
            tmp = this._splitLastOneCharacter(tmp.lastOneCharRemovedString);
            result.push(tmp.lastOneChar);
        } while (tmp.lastOneCharRemovedString.length > 0);
        return result.reverse();
    }
}
