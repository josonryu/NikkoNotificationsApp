/// <reference path="../reference.d.ts" />

App.factory('slsDelete', ['AppComDate', 'logicCom', function (AppComDate, logicCom) {

    return {

        /**
         * SFJ-20_01：申込データ指定削除
         */
        targetSlsDelete(keys: Array<string>, sucessCallback: any, errorCallback: any): void {

            logicCom.deleteSlsData(keys,
                () => {
                    // 成功
                    logicCom.infoLog('SLSデータ削除', { keys: keys });
                    return sucessCallback();

                }, (error: any) => {
                    // 失敗
                    return errorCallback(error);
                }
            );
        },

        /**
         * SFJ-20_02：期限切れ申込データ削除
         */
        deleteExpiredSlsData(sucessCallback: any, errorCallback: any): void {

            new Promise((resolve: any, reject: any) => {

                // 事務手続きのSLSデータの件数を取得する。
                logicCom.getSLSLength('2',
                    (result: number) => {
                        // 成功
                        return resolve(result);

                    }, (error: any) => {
                        // 失敗
                        return reject(error);
                    }
                );

            }).then((length: number) => {
                return new Promise((resolve: any, reject: any) => {

                    // 電子帳票のSLSデータの件数を取得する。
                    logicCom.getSLSLength('3',
                        (result: number) => {
                            // 成功
                            var sumLength: number = length + result;

                            if (sumLength) {
                                // 後続の処理に移る。
                                return resolve();

                            } else {
                                // データがなければ正常終了。
                                return sucessCallback();
                            }

                        }, (error: any) => {
                            // 失敗
                            return reject(error);
                        }
                    );

                })
            }).then(() => {
                return new Promise((resolve: any, reject: any) => {

                    // 事務手続きのSLSデータのキーを取得する。
                    logicCom.getSLSKeys('2',
                        (result: Array<string>) => {
                            // 成功
                            return resolve(result);

                        }, (error: any) => {
                            // 失敗
                            return reject(error);
                        }
                    );

                })
            }).then((keys: Array<string>) => {
                return new Promise((resolve: any, reject: any) => {

                    // 電子帳票のSLSデータのキーを取得する。
                    logicCom.getSLSKeys('3',
                        (result: Array<string>) => {
                            // 成功
                            // 事務手続きと電子帳票のSLSデータキーをマージする。
                            var joinKeys: Array<string> = keys.concat(result);
                            return resolve(joinKeys);

                        }, (error: any) => {
                            // 失敗
                            return reject(error);
                        }
                    );

                })
            }).then((keys: Array<string>) => {
                return new Promise((resolve: any) => {

                    // 今日の日付を取得
                    var today = AppComDate.getCurrentDate();

                    // 日付を比較し、削除対象のSLSデータをピックアップする
                    var deleteKeys: Array<string> = [];
                    for (var i: number = 0, length: number = keys.length; i < length; i++) {
                        var key: string = keys[i];
                        var applyDate: string = key.substr(0, 10);

                        if (today > applyDate) {
                            // 前日より前のデータを削除対象とする。
                            deleteKeys.push(key)
                        }
                    }

                    if (deleteKeys.length) {
                        // 削除対象のデータが存在する場合後続の処理を実行する。
                        return resolve(deleteKeys);
                    } else {
                        // 存在しない場合は正常終了する。
                        return sucessCallback();
                    }

                })
            }).then((keys: Array<string>) => {
                return new Promise((resolve: any, reject: any) => {

                    // SLSデータを削除する
                    logicCom.deleteSlsData(keys,
                        () => {
                            // 成功
                            return resolve(keys);

                        }, (error: any) => {
                            // 失敗
                            return reject(error);
                        }
                    );

                })
            }).then((keys: Array<string>) => {
                return new Promise(() => {

                    // 成功
                    return sucessCallback(keys);

                })
            }).catch((error) => {

                // 失敗
                return errorCallback(error);

            });
        }

    }

}])