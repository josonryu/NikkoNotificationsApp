/// <reference path='../reference.d.ts' />

App.controller('homeMenuController', ['$scope', '$controller', 'logicCom', 'AppBizCom',
    function ($scope, $controller, logicCom, AppBizCom) {
        $controller('applicationCompController', { $scope: $scope });

        /** 画面IDの定義. */
        var PAGE_ID_MAIN = 'G1040-01';
        var PAGE_ID_NEXT = 'G1050-01';
        var PAGE_ID_MDAL = 'G1040-02';
        var PAGE_NM_NEXT = 'selectPlace';

        /** ボタン名／名称 */
        var BTN_NM_JIMU = '事務手続き';
        var BTN_NM_DENSHI = '電子帳票';
        var BTN_NM_CLOSE = '閉じる'

        /** 業務メッセージコード */
        var MSG_01I = 'KKAP-SF002-01I';

        /** 申込種別 */
        var TYPE_NOTIF = '2';
        var TYPE_EFORM = '3';

        /** ログ出力 */
        var LOG_SEND_ACTION = '未送信案件を再送信';
        var LOG_SEND_COMP = '未送信案件の再送信完了';
        var LOG_SLS_ERR = 'SLSキー取得エラー'

        /** 最終ログイン時間. */
        var getTime = AppBizCom.DataHolder.getServiceTime();
        var serviceTime = Number(getTime.LOGIN_SYRY_ZKK.substr(0, 2)) + ':' + getTime.LOGIN_SYRY_ZKK.substr(3, 2);
        
        /** ボタン連打防止フラグ. */
        var stopBtnEventFLG = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };

        /**
         * 初期化処理.
         */
        var init = function () {
            // 未送信件数を初期化
            $scope.slsKeys = [];

            // SLS件数(申込種別：電子帳票)の取得
            var getEformSlsKeys = function () {

                logicCom.getSLSKeys(TYPE_EFORM,
                    (result: Array<string>) => {
                        // 成功
                        $scope.slsKeys = $scope.slsKeys.concat(result);
                        // 未送信メッセージの更新
                        $('#lblUnsentData').html(AppBizCom.Msg.getMsg(MSG_01I, [$scope.slsKeys.length, [serviceTime]]));
                        $scope.$applyAsync();

                    }, (error: any) => {
                        // 失敗
                        logicCom.errorLog(LOG_SLS_ERR, error);
                        // 未送信メッセージの更新
                        $('#lblUnsentData').html(AppBizCom.Msg.getMsg(MSG_01I, [$scope.slsKeys.length, [serviceTime]]));
                        $scope.$applyAsync();
                    }
                );
            };

            // SLS件数(申込種別：事務手続き)の取得
            logicCom.getSLSKeys(TYPE_NOTIF,
                (result: Array<string>) => {
                    // 成功
                    $scope.slsKeys = $scope.slsKeys.concat(result);
                    // SLS件数(申込種別：電子帳票)の取得
                    getEformSlsKeys();
                    
                }, (error: any) => {
                    // 失敗
                    logicCom.errorLog(LOG_SLS_ERR, error);
                    // SLS件数(申込種別：電子帳票)の取得
                    getEformSlsKeys();
                }
            );
        };

        /**
         * イベント: 「事務手続き」タップ時
         * 次画面へ遷移
         */
        $scope.toJimuTetsuduki = function () {

            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            };

            // 申込データ(事務手続き)初期化
            var notifInfo: any = {};
            AppBizCom.DataHolder.setNotifInfo(notifInfo);

            // 申込データ(電子帳票)クリア
            var eformInfo: any = undefined;
            AppBizCom.DataHolder.setEFormInfo(eformInfo);

            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_NEXT, BTN_NM_JIMU);
            //「G1050-01：受付場所の入力」へ遷移する。
            logicCom.locationPath(PAGE_NM_NEXT, callbackFLG, callbackFLG, connectionErrorCallback);
        };

        /**
         * イベント: 「電子帳票」タップ時
         * 次画面へ遷移
         */
        $scope.toDenshiChohyo = function () {
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            };

            // 申込データ(事務手続き)初期化
            var notifInfo: any = undefined;
            AppBizCom.DataHolder.setNotifInfo(notifInfo);

            // 申込データ(電子帳票)クリア
            var eformInfo: any = {};
            AppBizCom.DataHolder.setEFormInfo(eformInfo);

            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_NEXT, BTN_NM_DENSHI);
            //「G1050-01：受付場所の入力」へ遷移する。
            logicCom.locationPath(PAGE_NM_NEXT, callbackFLG, callbackFLG, connectionErrorCallback);
        };

        /**
        * イベント: 「未送信案件を再送信」タップ時
        * 未送信案件送信
        */
        $scope.sendUnsentData = function () {
            // ボタン連打防止フラグ	
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            };
        　  // ぼかしの背景のため、bodyにクラスを追加
            $('body').addClass('is-modal-open');
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_MDAL, LOG_SEND_ACTION, { slsKeys: $scope.slsKeys, slsLength: $scope.slsKeys.length });
            // 未送信案件送信のポップアップを表示する
            $('#' + PAGE_ID_MDAL).modal();
            $scope.$applyAsync();

            // 未送信案件の再送信を実行
            $scope.isSendComp = false;
            $scope.sendDataNum = 0;
            $scope.sendProgress = 0;
            $scope.successDataCnt = 0;
            $scope.failedDataCnt = 0;
            sendApplyInfo(0);
            // ボタン連打防止フラグ
            stopBtnEventFLG = false;

        };

        /**
         * 指定されたSLSデータを送信する
         * @param {number} i - SLSキー配列の参照位置
         */
        var sendApplyInfo = function (i: number) {
            // 未送信案件を全て送信し終えたら終了
            if (i >= $scope.slsKeys.length) {
                if ($scope.failedDataCnt > 0) {
                    logicCom.warnLog(LOG_SEND_COMP, { '送信済み': $scope.successDataCnt, '未送信': $scope.failedDataCnt });
                } else {
                    logicCom.infoLog(LOG_SEND_COMP, { '送信済み': $scope.successDataCnt, '未送信': $scope.failedDataCnt });
                }
                $scope.isSendComp = true;
                $scope.$applyAsync();
                return;
            }

            // プログレスバーを更新
            $scope.sendDataNum++;
            $scope.sendProgress = $scope.sendDataNum / $scope.slsKeys.length * 100;
            $scope.$applyAsync();

            var key: string = $scope.slsKeys[i];

            $scope.sendApplyInfo(key,
                (data: any) => {
                    // 成功
                    $scope.successDataCnt++;
                    return sendApplyInfo(++i);
                }, (error: any) => {
                    // 失敗
                    $scope.failedDataCnt++;
                    return sendApplyInfo(++i);
                }
            );
        };

        /**
         * 閉じるボタン押下時ログ出力
         */
        $scope.closeModal = function () {
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            };
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            init();
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MDAL, PAGE_ID_MAIN, BTN_NM_CLOSE);
            // ボタン連打防止フラグ
            stopBtnEventFLG = false;

        };

        init();
    }]);