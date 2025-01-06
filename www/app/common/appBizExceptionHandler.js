/// <reference path="../reference.d.ts" />
/*
    修正履歴
    2021/05/27 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ　CAC大橋
    手書きプラグインのエラーメッセージ無視条件を修正
 */
var selfAceh = null;
var errMsg = [];
// APPBIZ-C015エラー共通処理
class AppBizExceptionHandler {
    /**
     * コンストラクター
     *
     */
    constructor(appModule) {
        selfAceh = this;
        this.AppModule = appModule;
        try {
            document.addEventListener('deviceready', function () {
                try {
                    // ログ用DB開く、テーブル作成
                    var db = (window.sqlitePlugin).openDatabase({ name: 'aplLog.db', location: 'default' });
                    db.executeSql('CREATE TABLE IF NOT EXISTS LOG (PROPER_CD TEXT NOT NULL, UKETSUKE_MISE_CD TEXT NOT NULL, UKETSUKE_KAKARI_CD TEXT NOT NULL, LOG_TIME TEXT NOT NULL, IDO TEXT, KEIDO TEXT, APL_KBN TEXT NOT NULL, LEVEL TEXT NOT NULL, MESSAGE TEXT NOT NULL, ACTION TEXT NOT NULL, PRIMARY KEY(PROPER_CD, LOG_TIME))', [], function () {
                        selfAceh.errLogDb = db;
                        for (var param = errMsg.shift(); param; param = errMsg.shift()) {
                            selfAceh.errLogDb.executeSql('INSERT INTO LOG(PROPER_CD, UKETSUKE_MISE_CD, UKETSUKE_KAKARI_CD, LOG_TIME, IDO, KEIDO, APL_KBN, LEVEL, MESSAGE, ACTION) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', param);
                        }
                    });
                }
                catch (e1) {
                }
            }, false);
            this._registNgHandler();
            this._registJsHandler();
        }
        catch (e) {
        }
    }
    /**
     * エラーHandler共通処理
     *
     */
    errorHandler(message, file, line, col, err) {
        try {
            var d = new Date();
            var dateTime = `${d.getFullYear()}${selfAceh.leftPadZero((d.getMonth() + 1), 2)}${selfAceh.leftPadZero(d.getDate(), 2)}${selfAceh.leftPadZero(d.getHours(), 2)}${selfAceh.leftPadZero(d.getMinutes(), 2)}${selfAceh.leftPadZero(d.getSeconds(), 2)}${selfAceh.leftPadZero(d.getMilliseconds(), 3)}`;
            var msg = '';
            if (message) {
                // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 開始 20210527
                if (message.indexOf(".touches[1].clientX") >= 0) {
                    // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 終了 20210527
                    return;
                }
                if (file.indexOf("www/js/bootstrap.js") >= 0 && line == 1735 && col == 20) {
                    return;
                }
                if (document.getElementsByClassName("handwrite-pdb")[0] && message.indexOf("Script error.") >= 0) {
                    return;
                }
                msg += 'message:' + message + "\r\n";
            }
            if (file) {
                msg += 'file:' + file + "\r\n";
            }
            if (line) {
                msg += 'line:' + line + "\r\n";
            }
            if (err && 'stack' in err) {
                msg += 'stack:' + err.stack + "\r\n";
            }
            selfAceh.writeErrorLog(dateTime, msg);
        }
        catch (e) {
        }
        $('#footerMessage').show();
        $('#footerCloseButton').hide();
        // Title
        $('#txtTitle').html('システムエラーが発生しました。');
        // 本文
        $('#txtContents').html('システムエラーが発生しました。');
        $('#G1020').modal();
        $('body').addClass('is-modal-open');
        // 数字キーボードよりも前面にエラーメッセージを表示するための対応
        $(".modal-open .modal").css({ "z-index": 3000 });
        $(".modal-backdrop.fade").css({ "z-index": 2999 });
        $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
    }
    /**
     * Errorログ出力。
     *
     * @param {string} dateTime - 時刻
     * @param {string} message - エラーメッセージ
     *
     */
    writeErrorLog(dateTime, message) {
        selfAceh.writeLog(dateTime, message, 'E');
    }
    /**
     * Infoログ出力。
     *
     * @param {string} dateTime - 時刻
     * @param {string} message - エラーメッセージ
     *
     */
    writeInfoLog(dateTime, message) {
        selfAceh.writeLog(dateTime, message, 'I');
    }
    /**
     * ログ出力。
     *
     * @param {string} dateTime - 時刻
     * @param {string} message - エラーメッセージ
     * @param {string} level - メッセージlevel
     *
     */
    writeLog(dateTime, message, level) {
        try {
            if (selfAceh.errLogDb) {
                selfAceh.errLogDb.executeSql('INSERT INTO LOG(PROPER_CD, UKETSUKE_MISE_CD, UKETSUKE_KAKARI_CD, LOG_TIME, IDO, KEIDO, APL_KBN, LEVEL, MESSAGE, ACTION) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ['noUser', '000', '0000', dateTime, null, null, '2', level, '-', message]);
            }
            else {
                errMsg.push(['noUser', '000', '0000', dateTime, null, null, '2', level, '-', message]);
            }
        }
        catch (e) {
        }
    }
    /**
     * angularjsエラー処理
     *
     */
    _registNgHandler() {
        try {
            selfAceh.AppModule.provider({
                $exceptionHandler: function () {
                    this.$get = function () {
                        return function (exception, cause) {
                            selfAceh.errorHandler(exception.message, exception.sourceURL, exception.line, exception.column, exception);
                        };
                    };
                }
            });
        }
        catch (e) {
        }
    }
    /**
     * jsエラー処理
     *
     */
    _registJsHandler() {
        window.onerror = selfAceh.errorHandler;
    }
    /**
     * '0'を左に埋め込む
     *
     */
    leftPadZero(target, length) {
        return (Array(length).join('0') + target).slice(-length);
    }
}
