/// <reference path="../reference.d.ts" />

App.factory('logFileSend', ['AppComLog', 'appConst', function (AppComLog, appConst) {

    /**
     * サーバにログを送信する。
     * 
     * @param {(time: string) => void} sucessCallback - 成功時のコールバック関数
     * @param {(RESULT_CODE: number) => void} errorCallbackServerRes - 失敗時のコールバック関数（リザルトコードエラー）
     * @param {(error: any) => void} errorCallbackPost - 失敗時のコールバック関数（サーバ通信エラー）
     * @return void
     */
    function uploadLog(sucessCallback: (time: string) => void, errorCallbackServerRes: (RESULT_CODE: number) => void, errorCallbackPost: (error: any) => void): void {

        // ログファイル送信
        AppComLog.uploadLog(
            (subif010Recv: any, status: number, time: string) => {

                // 成功
                if (status == appConst.HTTP_OK) {

                    switch (Number(subif010Recv.RESULT_CODE)) {
                        // ログデータ受信結果正常
                        case appConst.SUBIF010.RESULT_CODE.OK:
                            return sucessCallback(time);

                        // ログデータ受信結果正常 ※リカバリ用ファイル出力
                        case appConst.SUBIF010.RESULT_CODE.OK_RECOVERY:
                            return sucessCallback(time);

                        // その他エラー
                        case appConst.SUBIF010.RESULT_CODE.OTHER_ERROR:
                            return errorCallbackServerRes(subif010Recv.RESULT_CODE);
                    }
                }

                // 通信エラー
                return errorCallbackPost({ HTTP_STATUS: status });

            }, (error: any) => {

                // 失敗
                return errorCallbackPost(error);
            }
        );
    };

    /**
     * サーバ送信済みのログを削除する。
     * 
     * @param {string} time - ログ送信日時
     * @param {() => void} sucessCallback - 成功時のコールバック関数
     * @param {(error: any) => void} errorCallback - 失敗時のコールバック関数
     * @return void
     */
    function deleteLog(time: string, sucessCallback: () => void, errorCallback: (error: any) => void): void {

        // ログ削除
        AppComLog.deleteLog(time,
            () => {
                // 成功
                return sucessCallback();

            }, (error: any) => {
                // 失敗
                return errorCallback(error);
            }
        );

    }

    return {

        /**
         * SFJ-26：ログファイル送信機能
         * 
         * @param sucessCallback - 成功時のコールバック関数
         * @param errorCallbackServerRes - 失敗時のコールバック関数（サーバ応答結果エラー）
         * @param errorCallbackPostTimeout - 失敗時のコールバック関数（通信エラー、タイムアウト）
         * @param errorCallbackDelete - 失敗時のコールバック関数（ログ削除失敗）
         * @return void
         */
        logFileSend(sucessCallback: () => void, errorCallbackServerRes: (RESULT_CODE: number) => void,
            errorCallbackPostTimeout: (error: any) => void, errorCallbackDelete: (error: any) => void): void {
            
            // ログをサーバに送信する
            uploadLog(
                (time: string) => {
                    // 成功時はログ削除を実行
                    deleteLog(time, sucessCallback, errorCallbackDelete);
                },
                // サーバ応答エラー時のコールバック
                errorCallbackServerRes,
                // 通信エラー時のコールバック
                errorCallbackPostTimeout
            );

        }

    }

}]);