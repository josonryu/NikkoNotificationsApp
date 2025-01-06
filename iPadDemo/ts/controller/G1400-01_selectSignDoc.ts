/// <reference path="../reference.d.ts" />
App.controller('selectSignDocController', ['$scope', '$controller', 'AppBizCom', 'appConst', 'logicCom', 'AppLgcMultiCheck', 'AppBizMsg', 'AppCom', 'APL_NAME',
    function ($scope, $controller, AppBizCom, appConst, logicCom, AppLgcMultiCheck, AppBizMsg, AppCom, APL_NAME) {

        // エラー共通部品を継承
        $controller('errorInfoModalCtrl', { $scope: $scope });

        /** ボタン連打防止フラグ. */
        var isStopBtn: boolean = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            isStopBtn = false;
        };

        /** 電子帳票対象書面選択画面. */
        var THIS_PAGE_ID: string = 'G1400-01';

        /** 電子帳票入力画面. */
        var NEXT_PAGE_ID: string = 'G1410-01';
        var NEXT_PAGE_PATH: string = 'signDoc';

        /** 申込中止画面（電子帳票）. */
        var STOP_MODAL_ID: string = 'G1400-03';

        /** ホームメニュー画面. */
        var HOME_PAGE_ID: string = 'G1040-01';
        var HOME_PAGE_PATH: string = 'homeMenu';

        /** 電子帳票対象書面選択のエラー項目表示画面. */
        var ERR_MODAL_ID: string = 'G1400-02';

        /** ボタン. */
        var NEXT_BTN_NAME: string = '次へ';
        var STOP_BTN_NAME: string = '中止する';
        var YES_BTN_NAME: string = 'はい';
        var NO_BTN_NAME: string = 'いいえ';
        var CLOSE_BTN_NAME: string = '閉じる';

        /** サービス時間情報. **/
        var serviceTime: any = AppBizCom.DataHolder.getServiceTime();
        var SRVC_KS_ZKK: string = Number(serviceTime.SRVC_KS_ZKK.substr(0, 2)) + ':' + serviceTime.SRVC_KS_ZKK.substr(3, 2);
        var SRVC_SYRY_ZKK: string = Number(serviceTime.SRVC_SYRY_ZKK.substr(0, 2)) + ':' + serviceTime.SRVC_SYRY_ZKK.substr(3, 2);

        /** システムエラー. */
        var ERR_SYSTEM: any = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-06E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-CM000-07E', [])
        };
        /** サービス時間外. */
        var ERR_SERVICE_TIME: any = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-13E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-CM000-14E', [APL_NAME, SRVC_KS_ZKK, SRVC_SYRY_ZKK]),
        };
        /** 通信エラー. */
        var ERR_NETWORK: any = {
            TITLE: AppBizCom.Msg.getMsg('KKAP-SF001-09E', []),
            CONTENTS: AppBizCom.Msg.getMsg('KKAP-SF004-04E', [APL_NAME]),
        };

        /** エラーメッセージ. */
        var MSG_NONE: string = '電子帳票フォーマット取得結果なし';
        var MSG_OFFLINE: string = '電子帳票フォーマット取得結果サービス時間外エラー';
        var MSG_OTHER_ERR: string = '電子帳票フォーマット取得結果その他エラー';
        var MSG_NETWORK_ERR: string = '電子帳票フォーマット取得通信エラー';

        /**
         * HTML生成前の初期化処理
         * 
         * @return void
         */
        var init: () => void = function (): void {

            // プルダウン初期化
            $scope.signDocTypes = AppBizCom.MstData.getCodeMstDataByKbn('SIGN_DOC_TYPES');  // 対象書面の選択プルダウン
            $scope.domainTypes = AppBizCom.MstData.getCodeMstDataByKbn('E_MAIL_DOMAIN');    // メールアドレスドメインプルダウン

            // 共通領域のデータ読込
            loadEFormInfo();

            // 入力定義の設定
            $scope.input = inputData;

        };

        // モーダル画面が表示される時、呼び出し元画面をスクロールできないように制御
        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };
        // モーダル画面が閉じられる時、呼び出し元画面をスクロールできるように制御
        var scrollUnlock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
        };

        /**
         * 保存済み共通領域から画面への読み込み処理
         * 
         * @return void
         */
        var loadEFormInfo: () => void = function (): void {

            // 共通領域から申込データ取得
            var eFormInfo: any = AppBizCom.DataHolder.getEFormInfo();
            // 画面に申込データを反映
            $scope.MODEL = angular.copy(eFormInfo.CHOHYO) || {};
        };

        /**
         * イベント：対象書面の選択
         * 
         * @return void
         */
        $scope.changeDoc = function (): void {

            // ボタン連打防止確認
            if (isStopBtn) return;
            // ボタン連打防止開始
            isStopBtn = true;

            //対象書面の切り替え
            if ($scope.MODEL.CHOHYO_ID == '871') {
                // メールアドレス削除
                delete $scope.MODEL.MAIL_ACCOUNT;
                delete $scope.MODEL.MAIL_DOMAIN_FLAG;
                delete $scope.MODEL.MAIL_DOMAIN;
                delete $scope.MODEL.MAIL_DOMAIN_C;
            } else {
                // メールアドレス入力欄をプルダウン選択モードで表示
                if (!$scope.MODEL.MAIL_DOMAIN_FLAG) {
                    $scope.MODEL.MAIL_DOMAIN_FLAG = '0';
                }
            }

            // ボタン連打防止解除
            isStopBtn = false;
        };

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // E-mailアドレス関連処理
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        /**
         * イベント：メールドメイン入力モード切替え
         *    0:直接入力モード  1:プルダウンモード
         * 
         * @return void
         */
        $scope.changeMailInputMode = function (): void {
            if ($scope.MODEL.MAIL_DOMAIN_FLAG == '1') {
                // 直接 ⇒ 選択
                delete $scope.MODEL.MAIL_DOMAIN;    // メールアドレスドメイン名
                $scope.MODEL.MAIL_DOMAIN_FLAG = '0';
            } else {
                // 選択 ⇒ 直接
                delete $scope.MODEL.MAIL_DOMAIN_C;  // メールアドレスドメインコード
                $scope.MODEL.MAIL_DOMAIN_FLAG = '1';
            }
            // エラークリア
            clearMailGroupError();
            AppBizMsg.clearError('mailAddress1');
            AppBizMsg.clearError('mailAddress2');
            AppBizMsg.clearError('domainType');

            inputData.MAIL_ACCOUNT['val'] = $scope.MODEL.MAIL_ACCOUNT;
            inputData.MAIL_DOMAIN['val'] = $scope.MODEL.MAIL_DOMAIN;
            AppLgcMultiCheck.inputCheck(inputData.MAIL_ACCOUNT, 'valChangChk');
            AppLgcMultiCheck.inputCheck(inputData.MAIL_DOMAIN, 'valChangChk');
        };

        /**
         * E-mailアドレス（ドメイン部）のプルダウン選択時
         */
        $scope.domainSelect = function () {
            // メールアドレス長さの相関チェックを再実施
            clearMailGroupError();
            checkMailAddrLen();
        };

        // E-mailアドレスの長さチェック
        var checkMailAddrLen = function () {
            if (!checkExistError('mailAddress1', 'mailAddress2', 'domainType', 'mailAddress1-mailAddress2-domainType')) {
                // 入力モードの判定
                if ($scope.MODEL.MAIL_DOMAIN_FLAG == '1') {
                    if ($scope.MODEL.MAIL_ACCOUNT && $scope.MODEL.MAIL_DOMAIN) {
                        var maxErr = checkGroupMaxLength(
                            'mailAddress1-mailAddress2-domainType', 49, true, 'KKAP-SF014-10E',
                            [], true, $scope.MODEL.MAIL_ACCOUNT, $scope.MODEL.MAIL_DOMAIN);
                        var minErr = checkGroupMinLength(
                            'mailAddress1-mailAddress2-domainType', 4, true, 'KKAP-CM000-15E',
                            ['E-mailアドレス', 5], true, $scope.MODEL.MAIL_ACCOUNT, $scope.MODEL.MAIL_DOMAIN);
                    }
                    if(maxErr == undefined && minErr != undefined){
                        return minErr;
                    }
                    if(maxErr != undefined && minErr == undefined){
                        return maxErr;
                    }
                }
                else {
                    if ($scope.MODEL.MAIL_ACCOUNT && $scope.MODEL.MAIL_DOMAIN_C) {
                        var codeMstData: any = AppBizCom.MstData.getCodeMstDataByCd('E_MAIL_DOMAIN', $scope.MODEL.MAIL_DOMAIN_C);
                        var domainName: string = codeMstData ? codeMstData.MSY : '';                     
                        var maxErr = checkGroupMaxLength(
                            'mailAddress1-mailAddress2-domainType', 49, true, 'KKAP-SF014-10E',
                            [], true, $scope.MODEL.MAIL_ACCOUNT, domainName);
                        var minErr = checkGroupMinLength(
                            'mailAddress1-mailAddress2-domainType', 4, true, 'KKAP-CM000-15E',
                            ['E-mailアドレス', 5], true, $scope.MODEL.MAIL_ACCOUNT, domainName);
                    }
                        if(maxErr == undefined && minErr != undefined){
                            return minErr;
                        }
                        if(maxErr != undefined && minErr == undefined){
                            return maxErr;
                    }
                }
            }
        };

        // E-mailアドレス（ローカル部）文字水準チェック
        var hasForbidMailLocalChar = function (): { errId: string, errMsg: string } {
            var result: { errId: string, errMsg: string };
            var mail1Value = $scope.MODEL.MAIL_ACCOUNT;
            if (mail1Value && !mail1Value.match(/^[\u0021\u002b\u002d\u002e\u002f\u0025\u0026\u003f\u005f\u0030-\u0039\u0041-\u005a\u0061-\u007a\u007e]+$/)) {
                result = {
                    errId: 'KKAP-CM000-08E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-08E', [inputData.MAIL_ACCOUNT.name])
                };
                return result;
            }
        };

        // E-mailアドレス（ドメイン部）桁数
        var chkMinDomainLength = function (): { errId: string, errMsg: string } {
            // 桁数チェック
            var result: { errId: string, errMsg: string };
            var mail2Value = $scope.MODEL.MAIL_DOMAIN;
            var mail2Len = 0;

            if (mail2Value) {
                mail2Len = mail2Value.length;
                if (mail2Len < 3) {
                    result = {
                        errId: 'KKAP-CM000-15E',
                        errMsg: AppBizMsg.getMsg('KKAP-CM000-15E', [inputData.MAIL_DOMAIN.name, 3])
                    };
                    return result;
                }
            }
        };

        // E-mailアドレス（ドメイン部）文字水準チェック
        var hasForbidMailDomainChar = function (): { errId: string, errMsg: string } {
            var result: { errId: string, errMsg: string };
            var mail2Value = $scope.MODEL.MAIL_DOMAIN;
            if (mail2Value && !mail2Value.match(/^[\u002d\u002e\u005f\u0030-\u0039\u0041-\u005a\u0061-\u007a]+$/)) {
                result = {
                    errId: 'KKAP-CM000-08E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-08E', [inputData.MAIL_DOMAIN.name])
                };
                return result;
            }
        };

        // E-mailアドレス（ドメイン部）規定値チェック（先頭文字）
        var mail2ChkHead = function (): { errId: string, errMsg: string } {
            var result: { errId: string, errMsg: string };
            var mail2Value = $scope.MODEL.MAIL_DOMAIN;
            if (mail2Value) {
                // 先頭文字チェック
                if (("-" == mail2Value.charAt(0)) || ("." == mail2Value.charAt(0))) {
                    result = {
                        errId: 'KKAP-SF014-12E',
                        errMsg: AppBizMsg.getMsg('KKAP-SF014-12E', [])
                    };
                    return result;
                }
            }
        };

        // E-mailアドレス（ドメイン部）規定値チェック（末尾文字）
        var mail2ChkEnd = function (): { errId: string, errMsg: string } {
            var result: { errId: string, errMsg: string };
            var mail2Value = $scope.MODEL.MAIL_DOMAIN;
            if (mail2Value) {
                // 末尾チェック
                if ("." == mail2Value.charAt(mail2Value.length - 1)) {
                    result = {
                        errId: 'KKAP-SF014-13E',
                        errMsg: AppBizMsg.getMsg('KKAP-SF014-13E', [])
                    };
                    return result;
                }
            }
        };

        // E-mailアドレス（ドメイン部）規定値チェック（ドット文字非連続）
        var mail2ChkCycle = function (): { errId: string, errMsg: string } {
            var result: { errId: string, errMsg: string };
            var mail2Value = $scope.MODEL.MAIL_DOMAIN;
            if (mail2Value) {
                // 連続チェック
                if (0 <= mail2Value.indexOf("..")) {
                    result = {
                        errId: 'KKAP-SF014-14E',
                        errMsg: AppBizMsg.getMsg('KKAP-SF014-14E', [])
                    };
                    return result;
                }
            }
        };

        // E-mailアドレス（ドメイン部）規定値チェック（ドット文字存在）
        var mail2ChkDomain = function (): { errId: string, errMsg: string } {
            var result: { errId: string, errMsg: string };
            var mail2Value = $scope.MODEL.MAIL_DOMAIN;
            if (mail2Value) {
                // ドット文字あるかチェック
                if (-1 == mail2Value.indexOf(".")) {
                    result = {
                        errId: 'KKAP-SF014-15E',
                        errMsg: AppBizMsg.getMsg('KKAP-SF014-15E', [])
                    };
                    return result;
                }
            }
        };

        // E-mailアドレスクリアエラー
        var clearMailGroupError = function (): void {
            AppBizMsg.clearError('mailAddress1-mailAddress2-domainType');
            clearMulitiIdsError('mailAddress1-mailAddress2-domainType');
        };

        // テキストボックスが空にされたトリガーを検出する
        [
            ['MODEL.MAIL_ACCOUNT', 'mailAddress1-mailAddress2-domainType'],
            ['MODEL.MAIL_DOMAIN', 'mailAddress1-mailAddress2-domainType']
        ].forEach(e => {
            $scope.$watch(e[0], function (newValue: string, oldValue: string) {
                if (newValue === oldValue) return;
                if (newValue == undefined || newValue === '') {
                    AppBizMsg.clearError(e[1]);
                    clearMulitiIdsError(e[1]);
                    if (e[2]) {
                        AppBizMsg.clearError(e[2]);
                    }
                };
            });
        });

        /**
         * 相関チェックエラークリアする。
         *
         * @param {string} groupId - エラー項目ID 「-」で連結する
         */
        var clearMulitiIdsError = function (groupId: string): void {
            clearErrorGroup(groupId);
            var ids = groupId.split('-');
            ids.forEach(function (id: string) {
                if (!checkExistError(id)) {
                    AppBizCom.Msg.clearError(id);
                }
            });
        };

        /**
         * 電子帳票フォーマット取得要求失敗時のコールバック関数
         * 
         * @param {any} subIf006Recv - 電子帳票フォーマット取得結果
         * @param {number} status - REDOSサーバ応答ステータス
         * @return void
         */
        var errorCallback = function (subIf006Recv: any, status: number): void {

            // REDOSサーバ応答結果
            var receive: any = {
                RESULT_CODE: subIf006Recv && subIf006Recv.RESULT_CODE,
                status: status
            };

            // インジケータ削除
            $('#overlay').remove();
            $('main').removeClass('loadingCircle_blur');

            scrollUnlock();

            // リザルトコード確認
            switch (subIf006Recv && Number(subIf006Recv.RESULT_CODE)) {

                case appConst.SUBIF006.RESULT_CODE.NONE:
                    // 取得結果なし（0件）：システムエラー画面
                    $scope.openErrorInfo(ERR_SYSTEM.TITLE, ERR_SYSTEM.CONTENTS);
                    logicCom.warnLog(MSG_NONE, receive);
                    break;

                case appConst.SUBIF006.RESULT_CODE.OFFLINE:
                    // オフライン中：サービス終了のお知らせ画面を表示
                    $scope.openErrorInfo(ERR_SERVICE_TIME.TITLE, ERR_SERVICE_TIME.CONTENTS);
                    logicCom.errorLog(MSG_OFFLINE, receive);
                    break;

                case appConst.SUBIF006.RESULT_CODE.OTHER_ERROR:
                    // その他エラー：システムエラー画面を表示
                    $scope.openErrorInfo(ERR_SYSTEM.TITLE, ERR_SYSTEM.CONTENTS);
                    logicCom.errorLog(MSG_OTHER_ERR, receive);
                    break;

                default:
                    // 通信エラー：閉じるボタン有りのエラー画面
                    $scope.openErrorInfoCloseable(ERR_NETWORK.TITLE, ERR_NETWORK.CONTENTS, ()=>{});
                    logicCom.warnLog(MSG_NETWORK_ERR, receive);
                    break;
            };

            // ボタン連打防止解除
            isStopBtn = false;
        };

        /**
         * イベント：「次へ」ボタンタップ時
         * 
         * @return void
         */
        $scope.nextBtnClick = function (): void {

            // ボタン連打防止開始
            if (isStopBtn) return;
            isStopBtn = true;

            scrollLock();

            // 一括チェック
            AppBizCom.Msg.clearAllErrors();
            var result = AppLgcMultiCheck.multiInputCheck(inputData, $scope.MODEL);

            if (result[0] === true) {

                // エラーモーダル表示
                var msgParam = result[1];
                $scope.errItemList = [];
                errListOutput(msgParam, itemOrder);
                $('body').addClass('is-modal-open');    // ぼかしの背景のため、bodyにクラスを追加
                $('#errItemModal').modal('show');

                // アクションログ出力
                logicCom.btnTapErrLog(THIS_PAGE_ID, ERR_MODAL_ID, NEXT_BTN_NAME, msgParam);

                // ボタン連打防止解除
                isStopBtn = false;

            } else {

                // インジケータ表示
                $('main').addClass('loadingCircle_blur');
                $('body').append('<div id="overlay"></div>');
                $('#overlay').append('<img class="loadingCircle" src="./images/loadingCircle.svg" draggable="false"></img>');

                // ログイン者データ取得
                var eFormInfo: any = AppBizCom.DataHolder.getEFormInfo();
                var eigyoinJoho: any = eFormInfo.EIGYOIN_JOHO;

                // 電子帳票フォーマット取得要求インターフェース作成
                var subIf006Send: any = {
                    PROPER_C: eigyoinJoho.PROPER_C,                     // 社員ID
                    UKETSUKE_MISE_C: eigyoinJoho.UKETSUKE_MISE_C,       // 受付者店部課コード
                    UKETSUKE_KAKARI_C: eigyoinJoho.UKETSUKE_KAKARI_C,   // 受付者係コード
                    CHOHYO_ID: $scope.MODEL.CHOHYO_ID,                  // 帳票ID
                };

                // REDOSサーバに帳票画像を要求
                AppCom.Http.post(appConst.SUBIF006.PATH, subIf006Send,
                    // 成功時の処理
                    (subIf006Recv: any, status: number) => {

                        if (status != appConst.HTTP_OK
                            || subIf006Recv.RESULT_CODE != appConst.SUBIF006.RESULT_CODE.OK) {

                            // ステータスが正常以外、またはリターンコード正常以外はエラー
                            return errorCallback(subIf006Recv, status);
                        }

                        // 共通領域に画面の入力内容を反映
                        setEFormInfo(subIf006Recv);
                        // アクションログ項目設定
                        var msgParam = result[1]; 
                        // アクションログ出力
                        logicCom.btnTapLog(THIS_PAGE_ID, NEXT_PAGE_ID, NEXT_BTN_NAME, msgParam);

                        // インジケータ削除
                        $('#overlay').remove();
                        $('main').removeClass('loadingCircle_blur');

                        scrollUnlock();

                        // 次ページに遷移
                        logicCom.locationPath(NEXT_PAGE_PATH, callbackFLG, callbackFLG, connectionErrorCallback);
                        $scope.$applyAsync();
                    },
                    errorCallback);
            }
        };

        /**
         * 共通領域保存処理
         * 
         * @param {any} subIf006Recv - 電子帳票フォーマット取得結果
         * @return void
         */
        var setEFormInfo = function (subIf006Recv: any): void {

            // 申込データに値を設定する
            var eFormInfo: any = AppBizCom.DataHolder.getEFormInfo();
            eFormInfo.CHOHYO = {
                CHOHYO_ID: $scope.MODEL.CHOHYO_ID,                  // 電子帳票ID
                MAIL_ACCOUNT: $scope.MODEL.MAIL_ACCOUNT,            // メールアカウント
                MAIL_DOMAIN_FLAG: $scope.MODEL.MAIL_DOMAIN_FLAG,    // メールドメイン入力モードフラグ
                MAIL_DOMAIN: $scope.MODEL.MAIL_DOMAIN,              // メールドメイン（直接入力時）
                MAIL_DOMAIN_C: $scope.MODEL.MAIL_DOMAIN_C           // メールドメインコード（プルダウン選択時）
            };

            // 申込データに画像データを設定
            var imageData: any = {
                DOC_BASE_GAZO: subIf006Recv.FMT_DATA,   // 電子帳票雛形画像
            };
            AppBizCom.DataHolder.setImageData(imageData);
        };

        /**
         * イベント：「中止する」ボタンタップ
         * 
         * @return void
         */
        $scope.stopBtnClick = function (): void {

            // ボタン連打防止確認
            if (isStopBtn) return;
            // ボタン連打防止開始
            isStopBtn = true;

            // アクションログ出力
            logicCom.btnTapLog(THIS_PAGE_ID, STOP_MODAL_ID, STOP_BTN_NAME);

            // 申込中止モーダル表示
            scrollLock();
            $('#' + STOP_MODAL_ID).modal('show');
            $('body').addClass('is-modal-open');

            // ボタン連打防止解除
            isStopBtn = false;
        };

        /**
         * イベント：申込中止画面の「はい」ボタンタップ
         * 
         * @return void
         */
        $scope.stopBtnYesClick = function (): void {

            // ボタン連打防止確認
            if (isStopBtn) return;
            // ボタン連打防止開始
            isStopBtn = true;

            // 業務共通領域のデータをクリアする
            var successCallBack = function () {
          
                // データをクリア
                AppBizCom.DataHolder.setEFormInfo({});      // 申込データ（電子帳票）
                AppBizCom.DataHolder.setImageData({});      // 画像データ
                AppBizCom.DataHolder.setCustomer({});       // 顧客基本情報
                AppBizCom.DataHolder.setLocation({});       // 位置情報
                AppBizCom.DataHolder.clearRouteInfo();      // 画面遷移ルーティング情報
            };

            // アクションログ出力
            logicCom.btnTapLog(STOP_MODAL_ID, HOME_PAGE_ID, YES_BTN_NAME);

            // 背景ぼかしを削除
            $('body').removeClass('is-modal-open');
            scrollUnlock();

            // ホームメニュー画面に遷移
            logicCom.locationPath(HOME_PAGE_PATH, successCallBack, callbackFLG, connectionErrorCallback);
        };

        /**
         * イベント：申込み中止画面の「いいえ」ボタンタップ
         * 
         * @return void
         */
        $scope.stopBtnNoClick = function (): void {

            // ボタン連打防止確認
            if (isStopBtn) return;
            // ボタン連打防止開始
            isStopBtn = true;

            // アクションログ出力
            logicCom.btnTapLog(STOP_MODAL_ID, THIS_PAGE_ID, NO_BTN_NAME);

            // モーダル画面を閉じる
            $('body').removeClass('is-modal-open');
            scrollUnlock();

            // ボタン連打防止解除
            isStopBtn = false;
        };

        /**
         * エラーをクリアする。
         * 
         * @param {string} id - エラー項目ID
         */
        var clearErrorGroup = function (id: string): void {
            //エラー項目取得
            var target: any = $('#' + id);
            if (target == null || target == undefined) {
                return;
            }
            // 関連項目ID（赤枠をクリア用）
            var releavteIds = [];
            //エラーメッセージ表示場所(親element)取得
            var rowDiv: any = target.parents('.input-check-row');
            var nextEle: any = rowDiv.next();
            //エラーメッセージをクリア
            if (nextEle && nextEle.hasClass('err-message')) {
                var errTargets = $('[class*=' + id + ']');
                errTargets.toArray().forEach(err => {
                    err.className !== id && (releavteIds = releavteIds.concat(err.className.split('-').filter(e => e !== id)));
                    err.remove();
                });
                if ($(nextEle).children().length == 0) {
                    $(nextEle).remove();
                }
            }
            // 項目の赤枠をクリア
            target.removeClass('err');
            releavteIds.length > 0 && new Set(releavteIds).forEach((e1, e2) => {
                !checkExistError(e2) && $('#' + e2).removeClass('err');
            });
            // 親ブロックの赤枠をクリア
            var areaDiv = target.parents('.input-check-area');
            areaDiv.find('.err').length == 0 && areaDiv.removeClass('err');
        };

        /**
         * グループ中の最大桁数チェック。
         * 
         * @param {string} ids - エラー項目ID 「-」で連結する
         * @param {string} maxLegth - 最大桁数
         * @param {string} isShowMsgOwn - メッセージ表示要フラグ
         * @param {string} msgID - エラーメッセージ用パラメータズ
         * @param {string} msgParams - エラーメッセージ用パラメータズ
         * @param {string} isShowOneMsgOnly - エラーメッセージ一回のみ表示する
         * @param {string} vals - エラーメッセージ用パラメータズ
         */
        var checkGroupMaxLength = function (ids: string, maxLegth: number, isShowMsgOwn: boolean, msgID: string, msgParams: Array<string>, isShowOneMsgOnly: boolean, ...vals): { errId: string, errMsg: string, noMsgShow: boolean } {
            // 単項目チェックエラーの場合、チェックを行わない
            if (checkExistError.apply(null, ids.split('-'))) return undefined;

            // Check
            var isErr = vals.reduce((totalLength, e) => angular.isString(e) ? totalLength + e.length : totalLength, 0) > maxLegth;

            if (isErr) {
                return showMsgAndMakeChekResult(isShowMsgOwn, ids, msgID, msgParams, isShowOneMsgOnly);
            } else {
                return undefined;
            }
        };

        /**
         * グループ中の最小桁数チェック。
         * 
         * @param {string} ids - エラー項目ID 「-」で連結する
         * @param {string} maxLegth - 最大桁数
         * @param {string} isShowMsgOwn - メッセージ表示要フラグ
         * @param {string} msgID - エラーメッセージ用パラメータズ
         * @param {string} msgParams - エラーメッセージ用パラメータズ
         * @param {string} isShowOneMsgOnly - エラーメッセージ一回のみ表示する
         * @param {string} vals - エラーメッセージ用パラメータズ
         */
        var checkGroupMinLength = function (ids, maxLegth, isShowMsgOwn, msgID, msgParams, isShowOneMsgOnly, ...vals) {
            // 単項目チェックエラーの場合、チェックを行わない
            if (checkExistError.apply(null, ids.split('-'))) return undefined;

            // Check
            var isErr = vals.reduce((totalLength, e) => angular.isString(e) ? totalLength + e.length : totalLength, 0) < maxLegth;

            if (isErr) {
                return showMsgAndMakeChekResult(isShowMsgOwn, ids, msgID, msgParams, isShowOneMsgOnly);
            } else {
                return undefined;
            }
        };

        /**
         * エラーメッセージ・エラー赤枠を画面に表示する。
         * 
         * @param {string} targetid - 表示用エラー項目ID
         * @param {string} id - エラー項目ID（グループIDも含む）
         * @param {string} msg - エラーメッセージ
         * @param {string} msgID - エラーメッセージID
         */
        var showErrorMsg = function (targetid: string, id: string, msg: string, msgID: string): void {
            var target: any = $('#' + targetid);
            if (target) {
                //エラーメッセージ表示場所(親element)取得
                var rowDiv: any = target.parents('.input-check-row');
                var nextEle: any = rowDiv.next();

                //エラーメッセージを表示
                var msgDom = '<span class=' + id + ' data-msgid="' + msgID + '">' + msg + '</span><br class=' + id + '>';
                if (nextEle.hasClass('err-message')) {
                    nextEle.html(nextEle.html() + msgDom);
                } else {
                    rowDiv.after('<div class="err-message">' + msgDom + '</div>');
                }
            }
        };

        /**
         * グループのエラーメッセージ・エラー赤枠を画面に表示する。
         * 
         * @param {string} groupID - エラー項目ID 「-」で連結する
         * @param {string} msg - エラーメッセージ
         * @param {string} msgID - エラーメッセージID
         * @param {string} isShowOneMsgOnly - エラーメッセージ一回のみ表示する
         */
        var showErrorItemsGroup = function (groupID: string, msg: string, msgID: string, isShowOneMsgOnly: boolean): void {
            var ids = groupID.split('-');
            // メッセージ表示
            if (isShowOneMsgOnly) {
                showErrorMsg(ids[0], groupID, msg, msgID);
            }
            ids.forEach(id => {
                // メッセージ表示
                !isShowOneMsgOnly && showErrorMsg(id, groupID, msg, msgID);
                //エラー項目取得
                var target: any = $('#' + id);
                if (target) {
                    //赤枠を表示
                    !target.hasClass('err') && target.addClass('err');

                    //エラーメッセージ表示場所(親element)取得
                    var rowDiv: any = target.parents('.input-check-row');
                    //ブロックに赤枠を表示
                    var container: any = rowDiv.parents('.input-check-area');
                    container && !container.hasClass('err') && container.addClass('err');
                }
            });
        };

        /**
         * 指定項目がエラーかどうかをチェックする。
         * 
         * @param {string} ids - エラー項目ID
         */
        var checkExistError = function (...ids) {
            return ids.some(id => $('[data-msgid]' + '.' + id).length > 0);
        };

        /**
        * エラーメッセージ表示とチェック返却値作成。
        * 
        * @param {string} isShowMsgOwn - メッセージ表示要フラグ
        * @param {string} id - エラー項目ID
        * @param {string} msgID - エラーメッセージID
        * @param {string} msgParams - エラーメッセージ用パラメータズ
        * @param {string} isShowOneMsgOnly - エラーメッセージ一回のみ表示する
        */
        var showMsgAndMakeChekResult = function (isShowMsgOwn, id, msgID, msgParams, isShowOneMsgOnly = true) {
            var msg = AppBizCom.Msg.getMsg(msgID, msgParams);
            if (isShowMsgOwn) {
                // メッセージを表示する
                showErrorItemsGroup(id, msg, msgID, isShowOneMsgOnly);
            }
            return { errId: msgID, errMsg: msg, noMsgShow: isShowMsgOwn };
        };

        /**
         * 画面項目入力定義
         */
        var inputData = {
            /** 対象書面. */
            CHOHYO_ID: {
                applyName: 'CHOHYO_ID',
                id: 'signDocType',
                name: '対象書面',
                typeSelect: true,
                allChk: ['isEmpty'],
            },
            /** E-mailアドレス（ローカル部）. */
            MAIL_ACCOUNT: {
                applyName: 'MAIL_ACCOUNT',
                id: 'mailAddress1',
                name: 'E-mailアドレス（ローカル部）',
                typeSelect: false,
                requireString: 'no_change',
                handWrite: 'mail',
                length: 45,
                valChangChk: [[clearMailGroupError], [hasForbidMailLocalChar, 'chkMaxLength', checkMailAddrLen], ['hasSimilar']],
                allChk: [[clearMailGroupError, 'isEmpty'], [hasForbidMailLocalChar, 'chkMaxLength', checkMailAddrLen]],
                similarType: 2,
            },
            /** E-mailアドレス（ドメイン部）. */
            MAIL_DOMAIN: {
                applyName: 'MAIL_DOMAIN',
                id: 'mailAddress2',
                name: 'E-mailアドレス（ドメイン部）',
                typeSelect: false,
                requireString: 'no_change',
                handWrite: 'mail',
                length: 48,
                valChangChk: [[clearMailGroupError], [hasForbidMailDomainChar, chkMinDomainLength, mail2ChkHead, mail2ChkEnd, mail2ChkCycle, mail2ChkDomain, 'chkMaxLength'], [checkMailAddrLen], ['hasSimilar']],
                allChk: [[clearMailGroupError, 'isEmpty'], [hasForbidMailDomainChar, chkMinDomainLength, mail2ChkHead, mail2ChkEnd, mail2ChkCycle, mail2ChkDomain, 'chkMaxLength'], [checkMailAddrLen]],
                similarType: 2,
            },
            /** E-mailアドレス（ドメイン部）プルダウン. */
            MAIL_DOMAIN_C: {
                applyName: 'MAIL_DOMAIN_C',
                id: 'domainType',
                name: 'E-mailアドレス（ドメイン部）',
                typeSelect: true,
                allChk: ['isEmpty'],
            }
        };

        /**
         * エラー項目ダイアログでのエラーグルーピング名定義
         */
        var itemGroups = [
            { item: '対象書面', group: '対象書面' },
            { item: 'E-mailアドレス（ローカル部）', group: 'E-mailアドレス' },
            { item: 'E-mailアドレス（ローカル部）の入力文字確認', group: 'E-mailアドレス' },
            { item: 'E-mailアドレス（ドメイン部）', group: 'E-mailアドレス' },
            { item: 'E-mailアドレス（ドメイン部）の入力文字確認', group: 'E-mailアドレス' }
        ];

        /**
         * エラー項目ダイアログでのエラー項目表示順定義
         */
        var itemOrder = [
            '対象書面',
            'E-mailアドレス'
        ];

        /**
         * エラー項目をダイアログ表示する
         * 
         * @param {any} param - チェックエラー内容
         * @param {any} order - ダイアログでエラー項目順番
         * @return void
         */
        var errListOutput = function (param, order): void {

            for (var item in param) {
                var setItem = {};
                // 入力チェックエラー場合
                if (param[item].chkErr) {
                    var groupName;
                    for (var i: number = 0; i < itemGroups.length; i++) {
                        if (itemGroups[i].item == inputData[item].name) {
                            groupName = itemGroups[i].group;
                            break;
                        }
                    }
                    setItem['name'] = groupName;
                    setItem['sort'] = order.indexOf(groupName);
                    if (!$scope.errItemList.some(errItem => errItem.name === setItem['name'])) {
                        $scope.errItemList.push(setItem);
                    }
                }
                // 類似文字確認済みチェックエラー場合
                if (param[item].linkChkErr) {
                    var itemName = inputData[item].name + "の入力文字確認"
                    var groupName;
                    for (var i: number = 0; i < itemGroups.length; i++) {
                        if (itemGroups[i].item == itemName) {
                            groupName = itemGroups[i].group;
                            break;
                        }
                    }
                    setItem['name'] = groupName;
                    setItem['sort'] = order.indexOf(groupName);
                    if (!$scope.errItemList.some(errItem => errItem.name === setItem['name'])) {
                        $scope.errItemList.push(setItem);
                    }
                }
            }
        };

        /**
         * エラー項目表示画面の「閉じる」ボタンタップ
         */
        $scope.closeErrItemModal = function(){
            // ２重クリックを防止
            if (isStopBtn) {
                return;
            } else {
                isStopBtn = true;
            }

            scrollUnlock();

            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            scrollUnlock();
            // アクションログ出力
            logicCom.btnTapLog(ERR_MODAL_ID, HOME_PAGE_ID, CLOSE_BTN_NAME);
            isStopBtn = false;
        };

        init();
    }]);