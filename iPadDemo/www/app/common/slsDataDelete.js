/// <reference path="../reference.d.ts" />
App.factory('slsDelete', ['AppComDate', 'logicCom', function (AppComDate, logicCom) {
        return {
            /**
             * SFJ-20_01：申込データ指定削除
             */
            targetSlsDelete(keys, sucessCallback, errorCallback) {
                logicCom.deleteSlsData(keys, () => {
                    // 成功
                    logicCom.infoLog('SLSデータ削除', { keys: keys });
                    return sucessCallback();
                }, (error) => {
                    // 失敗
                    return errorCallback(error);
                });
            },
            /**
             * SFJ-20_02：期限切れ申込データ削除
             */
            deleteExpiredSlsData(sucessCallback, errorCallback) {
                new Promise((resolve, reject) => {
                    // 事務手続きのSLSデータの件数を取得する。
                    logicCom.getSLSLength('2', (result) => {
                        // 成功
                        return resolve(result);
                    }, (error) => {
                        // 失敗
                        return reject(error);
                    });
                }).then((length) => {
                    return new Promise((resolve, reject) => {
                        // 電子帳票のSLSデータの件数を取得する。
                        logicCom.getSLSLength('3', (result) => {
                            // 成功
                            var sumLength = length + result;
                            if (sumLength) {
                                // 後続の処理に移る。
                                return resolve();
                            }
                            else {
                                // データがなければ正常終了。
                                return sucessCallback();
                            }
                        }, (error) => {
                            // 失敗
                            return reject(error);
                        });
                    });
                }).then(() => {
                    return new Promise((resolve, reject) => {
                        // 事務手続きのSLSデータのキーを取得する。
                        logicCom.getSLSKeys('2', (result) => {
                            // 成功
                            return resolve(result);
                        }, (error) => {
                            // 失敗
                            return reject(error);
                        });
                    });
                }).then((keys) => {
                    return new Promise((resolve, reject) => {
                        // 電子帳票のSLSデータのキーを取得する。
                        logicCom.getSLSKeys('3', (result) => {
                            // 成功
                            // 事務手続きと電子帳票のSLSデータキーをマージする。
                            var joinKeys = keys.concat(result);
                            return resolve(joinKeys);
                        }, (error) => {
                            // 失敗
                            return reject(error);
                        });
                    });
                }).then((keys) => {
                    return new Promise((resolve) => {
                        // 今日の日付を取得
                        var today = AppComDate.getCurrentDate();
                        // 日付を比較し、削除対象のSLSデータをピックアップする
                        var deleteKeys = [];
                        for (var i = 0, length = keys.length; i < length; i++) {
                            var key = keys[i];
                            var applyDate = key.substr(0, 10);
                            if (today > applyDate) {
                                // 前日より前のデータを削除対象とする。
                                deleteKeys.push(key);
                            }
                        }
                        if (deleteKeys.length) {
                            // 削除対象のデータが存在する場合後続の処理を実行する。
                            return resolve(deleteKeys);
                        }
                        else {
                            // 存在しない場合は正常終了する。
                            return sucessCallback();
                        }
                    });
                }).then((keys) => {
                    return new Promise((resolve, reject) => {
                        // SLSデータを削除する
                        logicCom.deleteSlsData(keys, () => {
                            // 成功
                            return resolve(keys);
                        }, (error) => {
                            // 失敗
                            return reject(error);
                        });
                    });
                }).then((keys) => {
                    return new Promise(() => {
                        // 成功
                        return sucessCallback(keys);
                    });
                }).catch((error) => {
                    // 失敗
                    return errorCallback(error);
                });
            }
        };
    }]);
