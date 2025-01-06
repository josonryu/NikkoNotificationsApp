/// <reference path="../reference.d.ts" />
App.controller('selectNecessaryDocController', ['$scope', 'AppBizCom', 'logicCom',
    function ($scope, AppBizCom, logicCom) {
        // エラーモーダル用イベント登録
        var ERR_MODAL_ID = 'G1020-02';
        $('#' + ERR_MODAL_ID).on('show.bs.modal', () => {
            $('body').addClass('is-modal-open');
        });
        // エラーモーダル用イベント廃棄
        $scope.$on('$destroy', () => {
            $('#' + ERR_MODAL_ID).off('show.bs.modal');
        });
        // 番号確認書類マスタデータ取得
        var idTypes = AppBizCom.MstData.getCodeMstDataByKbn('NMBR_KAKNN_SHOR');
        var MYNUM_CARD = idTypes[0].CD; // 個人番号カード
        var NOTICE_CARD = idTypes[1].CD; // 通知カード
        var RESIDENCE = idTypes[2].CD; // 住民票の写し
        var RESIDENCE_CERTIFICATE = idTypes[3].CD; // 住民票の記載事項証明書
        // 画面ID定義
        var MAIN_PAGE_ID = 'G1100-01'; // 番号確認書類のご説明・ご選択画面画面
        var PRE_PAGE_ID = 'G1090-01'; // 確認書類撮影開始画面
        var NEXT_PAGE_ID = 'G1110-01'; // 個人番号入力画面
        // 画面PATH定義
        var NEXT_PAGE_PATH = 'mynumberInput';
        // ボタン連打防止フラグ
        var stopBtnEventFLG = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };
        // 選択状況クリア処理
        var selectStatusClear = () => {
            $scope.chkMyNumberCard = false;
            $scope.chkNoticeCard = false;
            $scope.chkResidence = false;
            $scope.selectResidence = { val: '' };
        };
        // 共通領域保存処理
        var setNotifInfo = (numDoc) => {
            var applyInfo = AppBizCom.DataHolder.getNotifInfo();
            // 選択状況に変更が無い場合
            if (applyInfo.MNSYSEIRY_JOHO && applyInfo.MNSYSEIRY_JOHO.MNSYSEIRY_K === numDoc) {
            }
            else {
                // 申込データ(事務手続き)設定
                applyInfo.MNSYSEIRY_JOHO = applyInfo.MNSYSEIRY_JOHO ? applyInfo.MNSYSEIRY_JOHO : {};
                applyInfo.MNSYSEIRY_JOHO.MNSYSEIRY_K = numDoc;
                if (!$scope.editMode) {
                    // 確認画面から番号確認書類を修正する以外の場合、かつ番号確認書類を変更した場合、
                    // 本人確認書類の情報を初期化する。
                    applyInfo.HONIN_KAKNIN_SY_JOHO = {};
                }
                AppBizCom.DataHolder.setNotifInfo(applyInfo);
                // 申込データ(特定個人情報)設定
                AppBizCom.DataHolder.setPersonInfo({ MYNO: '' });
            }
        };
        var init = () => {
            // 遷移元により表示、遷移先変更
            var flags = AppBizCom.DataHolder.getFlowControlFlg();
            if (!flags.CAMERA_FLG_CONTROL) {
                flags.CAMERA_FLG_CONTROL = {};
            }
            $scope.editMode = flags.CAMERA_FLG_CONTROL.MOD_FLG;
            // 修正時、パンくずは「G1240-01：お申し込み内容確認画面」と同じパターンで表示する。
            $scope.pankuzuPatten = $scope.editMode ? '4' : '2';
            // 次へボタン非活性
            $scope.btnNextDisabled = true;
            // メッセージ取得
            $scope.msgExpirationDate = AppBizCom.Msg.getMsg('KKAP-SF008-01I', []);
        };
        // 初期化処理
        $scope.init = () => {
            // ルーティング情報削除
            AppBizCom.DataHolder.deleteRouteInfoByPath('selectNecessaryDoc');
            // 番号確認書類選択区分反映
            var applyInfo = AppBizCom.DataHolder.getNotifInfo();
            // 番号確認書類選択済みの場合
            if (applyInfo.MNSYSEIRY_JOHO && !AppBizCom.InputCheck.isEmpty(applyInfo.MNSYSEIRY_JOHO.MNSYSEIRY_K)) {
                switch (applyInfo.MNSYSEIRY_JOHO.MNSYSEIRY_K) {
                    case '1':
                        $scope.chkMyNumberCard = true; // 個人番号カード
                        break;
                    case '2':
                        $scope.chkNoticeCard = true; // 通知カード
                        break;
                    case '3':
                        $scope.chkResidence = true;
                        $scope.selectResidence = { val: '3' }; // 住民票の写し
                        break;
                    case '4':
                        $scope.chkResidence = true;
                        $scope.selectResidence = { val: '4' }; // 住民票の記載事項証明書
                        break;
                }
                // 次へボタン活性
                $scope.btnNextDisabled = false;
            }
        };
        // イベント：番号確認書類の選択時
        $scope.checkAreaClick = (selectDocument) => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 住民票の写し選択時
            if (selectDocument == 'residence') {
                if (!$scope.chkResidence) {
                    // 選択状況のクリア
                    selectStatusClear();
                    $scope.chkResidence = true;
                    // 次へボタン非活性
                    $scope.btnNextDisabled = true;
                }
            }
            else {
                // 個人番号カード選択時
                if (selectDocument == 'myNumberCard') {
                    if (!$scope.chkMyNumberCard) {
                        // 選択状況のクリア
                        selectStatusClear();
                        $scope.chkMyNumberCard = true;
                    }
                }
                else if (selectDocument == 'noticeCard') {
                    if (!$scope.chkNoticeCard) {
                        // 選択状況のクリア
                        selectStatusClear();
                        $scope.chkNoticeCard = true;
                    }
                }
                // 次へボタン活性
                $scope.btnNextDisabled = false;
            }
            stopBtnEventFLG = false;
        };
        // イベント：住民票の写しor住民票の記載事項証明書の選択時
        $scope.residenceTypeClick = $event => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            $event.stopPropagation();
            // 次へボタン活性
            $scope.btnNextDisabled = false;
            stopBtnEventFLG = false;
        };
        // イベント：「戻る」ボタンタップ時
        $scope.btnBackClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            var from = MAIN_PAGE_ID;
            var to = PRE_PAGE_ID;
            var btnName = '戻る';
            // ログ出力
            logicCom.btnTapLog(from, to, btnName);
            // 前画面へ遷移する
            var path = AppBizCom.DataHolder.getPrevRoutePath();
            logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);
        };
        // イベント：「次へ」ボタンタップ時
        $scope.btnNextClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 選択済み番号確認書類
            var selectedNum = '';
            // 個人番号カード選択時
            if ($scope.chkMyNumberCard) {
                selectedNum = MYNUM_CARD;
            }
            else if ($scope.chkNoticeCard) {
                selectedNum = NOTICE_CARD;
            }
            else if ($scope.selectResidence.val === '3') {
                selectedNum = RESIDENCE;
            }
            else {
                selectedNum = RESIDENCE_CERTIFICATE;
            }
            //共通領域へ保存
            setNotifInfo(selectedNum);
            // ログ出力
            var result = {
                'MNSYSEIRY_K': { 'value': selectedNum }
            };
            logicCom.btnTapLog(MAIN_PAGE_ID, NEXT_PAGE_ID, '次へ', result);
            // 次ページに遷移
            logicCom.locationPath(NEXT_PAGE_PATH, callbackFLG, callbackFLG, connectionErrorCallback);
        };
        // 初期化
        init();
    }]);
