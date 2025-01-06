/// <reference path="../reference.d.ts" />
App.controller('customerFinalInputController', ['$scope', '$routeParams', 'AppBizCom', 'logicCom', 'AppBizMsg', 'AppLgcMultiCheck', '$timeout', 'AppComDate', 'AppBizInputCheck', 'appDefine', 'AppLgcApplyAssign',
    function ($scope, $routeParams, AppBizCom, logicCom, AppBizMsg, AppLgcMultiCheck, $timeout, AppComDate, AppBizInputCheck, appDefine, AppLgcApplyAssign) {
        // ログ出力用画面ID定義
        var PAGE_ID_MAIN = 'G1230-01'; // 暗証番号確認画面
        var PAGE_ID_PRE = 'G1220-01'; // 申込内容確認開始画面
        var PAGE_ID_NEXT = 'G1240-01'; // お客様確認画面画面
        var PAGE_PATH_NEXT = 'applicationConfirm'; // お客様確認画面パス
        var POPUP_ID = 'G1230-02'; // 暗証番号入力画面
        // 連打防止フラグ
        var passwordModalFLG = true;
        var callbackFLG = function () { };
        var passwordConfirmFLG = true;
        var passwordCancelFLG = true;
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            passwordModalFLG = true;
        };
        var init = function () {
            // 画面の編集モード
            $scope.editMode = $routeParams.prev === 'applicationConfirm' ? true : false;
            // 保存済み共通領域から画面への読み込み処理
            loadNotifInfo();
            // 画面入力項目データをスコープへ設定
            $scope.input = angular.copy(inputData);
        };
        /**
         * G1230-01 イベント2：「暗証番号の設定」ボタンタップ時
         */
        $scope.showPinModal = function () {
            if (!passwordModalFLG) {
                return;
            }
            passwordModalFLG = false;
            // すべてのエラー情報をクリア
            AppBizMsg.clearAllErrors();
            $scope.MODEL.password = "";
            $scope.MODEL.checkPassword = "";
            // ボタン表示フラグ
            $scope.displayType = 1;
            // 暗証番号入力に値が設定されている場合
            if ($scope.finishedPassword) {
                // 暗証番号入力および確認用暗証番号入力を数値表示する
                $scope.MODEL.password = $scope.finishedPassword;
                $scope.MODEL.checkPassword = $scope.finishedPassword;
                // 3秒後にマスク表示へ切り替える。
                $timeout(function () { $scope.mask3Seconds(); }, 3000);
                logicCom.debugLog('初期表示時間:' + AppComDate.getCurrentTimeMillis());
            }
            scrollLock();
            $('#' + POPUP_ID).modal('show');
            // ぼかしの背景のため、bodyにクラスを追加
            $('body').addClass('is-modal-open');
            // ログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, POPUP_ID, '暗証番号の設定');
        };
        /**
         * G1230-02 イベント2：暗証番号入力から1.5秒経過またはテンキー入力があった場合に、マスク表示を行う。
         */
        $scope.changePass = function () {
            // 最後入力値取得
            var wLastStr = $scope.MODEL.password.slice(-1);
            // 暗証番号なしの場合
            if (!$scope.MODEL.NIKKO_CARD_PIN) {
                $scope.MODEL.NIKKO_CARD_PIN = wLastStr;
            }
            else {
                // 最後入力値がマスクされているの場合
                if ('*' == wLastStr) {
                    // 暗証番号更新する。
                    $scope.MODEL.NIKKO_CARD_PIN = $scope.MODEL.NIKKO_CARD_PIN.slice(0, $scope.MODEL.password.length);
                }
                else {
                    // 暗証番号更新する。
                    $scope.MODEL.NIKKO_CARD_PIN = $scope.MODEL.NIKKO_CARD_PIN.slice(0, $scope.MODEL.password.length - 1) + wLastStr;
                }
            }
            // 入力状態がマスク入力時の場合
            if (1 == $scope.displayType) {
                // 入力から1.5秒経過またはテンキー入力があった場合に、マスク表示を行う。
                $scope.MODEL.password = Array($scope.MODEL.NIKKO_CARD_PIN.length).join('*') + wLastStr;
                var lengthCheck = $scope.MODEL.password.length;
                $timeout(function () { $scope.mask(1, lengthCheck); }, 1500);
                logicCom.debugLog('入力完了時間:' + AppComDate.getCurrentTimeMillis());
            }
        };
        /**
         * G1230-02 イベント2：確認用暗証番号入力から1.5秒経過またはテンキー入力があった場合に、マスク表示を行う。
         */
        $scope.changeCheckPass = function () {
            // 最後入力値取得
            var wLastStr = $scope.MODEL.checkPassword.slice(-1);
            // 暗証番号なしの場合
            if (!$scope.MODEL.NIKKO_CARD_PINCHECK) {
                $scope.MODEL.NIKKO_CARD_PINCHECK = wLastStr;
            }
            else {
                // 最後入力値がマスクされているの場合
                if ('*' == wLastStr) {
                    // 暗証番号更新する。
                    $scope.MODEL.NIKKO_CARD_PINCHECK = $scope.MODEL.NIKKO_CARD_PINCHECK.slice(0, $scope.MODEL.checkPassword.length);
                }
                else {
                    // 暗証番号更新する。
                    $scope.MODEL.NIKKO_CARD_PINCHECK = $scope.MODEL.NIKKO_CARD_PINCHECK.slice(0, $scope.MODEL.checkPassword.length - 1) + '' + wLastStr;
                }
            }
            // 入力状態がマスク入力時の場合
            if (1 == $scope.displayType) {
                // 入力から1.5秒経過またはテンキー入力があった場合に、マスク表示を行う。
                $scope.MODEL.checkPassword = Array($scope.MODEL.NIKKO_CARD_PINCHECK.length).join('*') + wLastStr;
                var lengthCheck = $scope.MODEL.checkPassword.length;
                $timeout(function () { $scope.mask(2, lengthCheck); }, 1500);
                logicCom.debugLog('入力完了時間:' + AppComDate.getCurrentTimeMillis());
            }
        };
        // 保存済み共通領域から画面への読み込み処理
        var loadNotifInfo = function () {
            var notifInfo = AppBizCom.DataHolder.getNotifInfo();
            $scope.MODEL = angular.copy(notifInfo.PIN_JOHO) || {};
            // 保存済み共通領域があるの場合
            if ($scope.MODEL) {
                $scope.finishedPassword = $scope.MODEL.NIKKO_CARD_PIN;
                $scope.MODEL.NIKKO_CARD_PINCHECK = $scope.MODEL.NIKKO_CARD_PIN;
            }
        };
        // 共通領域保存処理
        var setNotifInfo = function () {
            var applyObj = appDefine.offerDetailData.PIN_JOHO;
            var modelObj = $scope.MODEL;
            var notifInfo = AppBizCom.DataHolder.getNotifInfo();
            notifInfo.PIN_JOHO = AppLgcApplyAssign.objAssign(applyObj, modelObj);
            AppBizCom.DataHolder.setNotifInfo(notifInfo);
        };
        /**
         * G1230-02 イベント3：暗証番号を確定する
         */
        $scope.confirm = function () {
            if (!passwordConfirmFLG) {
                return;
            }
            passwordConfirmFLG = false;
            var from = POPUP_ID;
            var to = PAGE_ID_MAIN;
            var msgParam = {};
            var transition = true;
            // 一括チェックする前に、すべてのエラー情報をクリア
            AppBizMsg.clearAllErrors();
            // 一括チェック
            var result = AppLgcMultiCheck.multiInputCheck(inputData, $scope.MODEL);
            msgParam = result[1];
            if (result[0]) {
                transition = false;
            }
            // エラーなしの場合
            if (transition) {
                // 入力された暗証番号を申込データ(口座開設)に設定する。
                $scope.finishedPassword = $scope.MODEL.NIKKO_CARD_PIN;
                // ログ出力
                logicCom.btnTapLog(from, to, '確定', msgParam);
                // ぼかしの背景を消すため、bodyにクラスを削除
                $('body').removeClass('is-modal-open');
                $('#' + POPUP_ID).modal('hide');
                scrollUnlock();
                passwordModalFLG = true;
                // 「確定」ボタン押下時に、無条件でチェックボックスのチェックを外す
                $scope.MODEL.NIKKO_CARD_MSKM_K = undefined;
            }
            else {
                to = POPUP_ID;
                // ログ出力
                logicCom.btnTapErrLog(from, to, '確定', msgParam);
            }
            passwordConfirmFLG = true;
        };
        /**
         * G1230-02 イベント5：暗証番号を表示する
         */
        $scope.unmask = function () {
            $scope.displayType = 0;
            $scope.MODEL.password = $scope.MODEL.NIKKO_CARD_PIN;
            $scope.MODEL.checkPassword = $scope.MODEL.NIKKO_CARD_PINCHECK;
            // ログ出力
            logicCom.btnTapLog(POPUP_ID, POPUP_ID, '暗証番号を表示');
        };
        /**
         * G1230-02 イベント5：暗証番号を隠す
         * @param {any} param - 1:暗証番号の場合 2:確認用暗証番号の場合 3:「暗証番号を表示」ボタンを押すの場合
         * @param {string} lengthCheck - 桁数チェック
         */
        $scope.mask = function (param, lengthCheck) {
            //「暗証番号を隠す」ボタンを押すの場合
            if (3 == param) {
                $scope.displayType = 1;
                // ログ出力
                logicCom.btnTapLog(POPUP_ID, POPUP_ID, '暗証番号を隠す');
            }
            if (1 == $scope.displayType) {
                // 暗証番号を隠す
                if ((1 == param && lengthCheck == $scope.MODEL.password.length) || 3 == param) {
                    if ($scope.MODEL.password && $scope.MODEL.password.match(/[^\*]$/)) {
                        $scope.MODEL.password = Array($scope.MODEL.password.length + 1).join('*');
                    }
                }
                // 確認用暗証番号を隠す
                if ((2 == param && lengthCheck == $scope.MODEL.checkPassword.length) || 3 == param) {
                    if ($scope.MODEL.checkPassword && $scope.MODEL.checkPassword.match(/[^\*]$/)) {
                        $scope.MODEL.checkPassword = Array($scope.MODEL.checkPassword.length + 1).join('*');
                    }
                }
                if (3 != param) {
                    logicCom.debugLog('マスク完了時間:' + AppComDate.getCurrentTimeMillis());
                }
            }
        };
        /**
         * G1230-02 イベント1：3秒後にマスク表示へ切り替える
         */
        $scope.mask3Seconds = function () {
            // 「暗証番号を表示」ボタンの場合
            if (1 == $scope.displayType) {
                if ($scope.MODEL.password && $scope.MODEL.password.match(/[^\*]$/)) {
                    $scope.MODEL.password = Array($scope.MODEL.password.length + 1).join('*');
                }
                if ($scope.MODEL.checkPassword && $scope.MODEL.checkPassword.match(/[^\*]$/)) {
                    $scope.MODEL.checkPassword = Array($scope.MODEL.checkPassword.length + 1).join('*');
                }
                logicCom.debugLog('マスク完了時間:' + AppComDate.getCurrentTimeMillis());
            }
        };
        /**
         * G1230-02 イベント4：暗証番号をキャンセル
         */
        $scope.cancel = function () {
            if (!passwordCancelFLG) {
                return;
            }
            passwordCancelFLG = false;
            // 暗証番号クリア
            $scope.MODEL.NIKKO_CARD_PIN = "";
            $scope.MODEL.NIKKO_CARD_PINCHECK = "";
            // 暗証番号入力に値が設定されている場合
            if ($scope.finishedPassword) {
                // 暗証番号入力および確認用暗証番号入力を数値表示する
                $scope.MODEL.NIKKO_CARD_PIN = $scope.finishedPassword;
                $scope.MODEL.NIKKO_CARD_PINCHECK = $scope.finishedPassword;
            }
            // ログ出力
            logicCom.btnTapLog(POPUP_ID, PAGE_ID_MAIN, 'キャンセル');
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            $('#' + POPUP_ID).modal('hide');
            scrollUnlock();
            passwordModalFLG = true;
            passwordCancelFLG = true;
        };
        /**
         * G1230-01 イベント4：「次へ」ボタンタップ時
         */
        $scope.nextBtnClick = function () {
            if (!passwordModalFLG) {
                return;
            }
            passwordModalFLG = false;
            var successCallBack = function () {
                setNotifInfo();
            };
            logicCom.locationPath(PAGE_PATH_NEXT, successCallBack, callbackFLG, connectionErrorCallback);
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_NEXT, '次へ', { NIKKO_CARD_MSKM_K: { value: $scope.MODEL.NIKKO_CARD_MSKM_K } });
        };
        /**
         * G1230-01 イベント5：「戻る」ボタンタップ時
         */
        $scope.backBtnClick = function () {
            if (!passwordModalFLG) {
                return;
            }
            passwordModalFLG = false;
            //「APPBIZ-J002： 業務共通領域機能」を呼び出し「画面遷移ルーティング情報の取得」処理より遷移先を取得し、前画面へ遷移する。
            var path = AppBizCom.DataHolder.getPrevRoutePath();
            logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_PRE, '戻る');
        };
        /**
         * G1230-01 イベント6：「確認画面へ」ボタンタップ時
         */
        $scope.confirmBtnClick = function () {
            if (!passwordModalFLG) {
                return;
            }
            passwordModalFLG = false;
            var successCallBack = function () {
                setNotifInfo();
            };
            logicCom.locationPath(PAGE_PATH_NEXT, successCallBack, callbackFLG, connectionErrorCallback);
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_NEXT, '確認画面へ', { NIKKO_CARD_MSKM_K: { value: $scope.MODEL.NIKKO_CARD_MSKM_K } });
        };
        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };
        var scrollUnlock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
        };
        /**
         * 「暗証番号」に数字以外で入力された場合エラー。
         */
        var isNumPW = function () {
            var result;
            if (!AppBizInputCheck.isNum($scope.MODEL.NIKKO_CARD_PIN)) {
                result = {
                    errId: 'KKAP-CM000-03E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-03E', ['暗証番号', '数字'])
                };
            }
            return result;
        };
        /**
         * 「暗証番号」に4桁未満で入力された場合エラー。
         */
        var chkSameLengthPW = function () {
            var result;
            if (AppBizInputCheck.chkMaxLength($scope.MODEL.NIKKO_CARD_PIN, 4) != 0) {
                result = {
                    errId: 'KKAP-CM000-04E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-04E', ['暗証番号', '4'])
                };
            }
            return result;
        };
        /**
         * 「暗証番号」に0000若しくは9999が入力された場合エラー。
         */
        var chkFourZeroNinePW = function () {
            var result;
            if ('0000' == $scope.MODEL.NIKKO_CARD_PIN || '9999' == $scope.MODEL.NIKKO_CARD_PIN) {
                result = {
                    errId: 'KKAP-SF018-02E',
                    errMsg: AppBizMsg.getMsg('KKAP-SF018-02E', ['暗証番号'])
                };
            }
            return result;
        };
        /**
         * 「確認用暗証番号」に数字以外で入力された場合エラー。
         */
        var isNumChkPW = function () {
            var result;
            if (!AppBizInputCheck.isNum($scope.MODEL.NIKKO_CARD_PINCHECK)) {
                result = {
                    errId: 'KKAP-CM000-03E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-03E', ['確認用暗証番号', '数字'])
                };
            }
            return result;
        };
        /**
         * 「確認用暗証番号」に4桁未満で入力された場合エラー。
         */
        var chkSameLengthChkPW = function () {
            var result;
            if (AppBizInputCheck.chkMaxLength($scope.MODEL.NIKKO_CARD_PINCHECK, 4) != 0) {
                result = {
                    errId: 'KKAP-CM000-04E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-04E', ['確認用暗証番号', '4'])
                };
            }
            return result;
        };
        /**
         * 「確認用暗証番号」に0000若しくは9999が入力された場合エラー。
         */
        var chkFourZeroNineChkPW = function () {
            var result;
            if ('0000' == $scope.MODEL.NIKKO_CARD_PINCHECK || '9999' == $scope.MODEL.NIKKO_CARD_PINCHECK) {
                result = {
                    errId: 'KKAP-SF018-02E',
                    errMsg: AppBizMsg.getMsg('KKAP-SF018-02E', ['確認用暗証番号'])
                };
            }
            return result;
        };
        /**
         * 「暗証番号」と「確認用暗証番号」が一致しない場合エラー。
         */
        var chkSamePassword = function () {
            var result;
            var passwordErr = document.getElementsByClassName('txtPassword');
            var checkPasswordErr = document.getElementsByClassName('txtCheckPassword');
            if (0 == passwordErr.length && 0 == checkPasswordErr.length) {
                if ($scope.MODEL.NIKKO_CARD_PIN != $scope.MODEL.NIKKO_CARD_PINCHECK) {
                    result = {
                        errId: 'KKAP-SF018-01E',
                        errMsg: AppBizMsg.getMsg('KKAP-SF018-01E')
                    };
                }
            }
            return result;
        };
        var inputData = {
            NIKKO_CARD_PIN: {
                id: 'txtPassword',
                name: '暗証番号',
                numPad: 'numkeyboard-right password-input',
                length: 4,
                errAreaId: 'txtPassword',
                onBlurChk: [[isNumPW, chkSameLengthPW, chkFourZeroNinePW]],
                allChk: [['isEmpty'], ['isNum', 'chkSameLength', chkFourZeroNinePW]]
            },
            NIKKO_CARD_PINCHECK: {
                id: 'txtCheckPassword',
                name: '確認用暗証番号',
                numPad: 'numkeyboard-right password-input',
                length: 4,
                errAreaId: 'txtCheckPassword',
                onBlurChk: [[isNumChkPW, chkSameLengthChkPW, chkFourZeroNineChkPW]],
                allChk: [['isEmpty'], ['isNum', 'chkSameLength', chkFourZeroNineChkPW, chkSamePassword]]
            }
        };
        init();
    }]);
