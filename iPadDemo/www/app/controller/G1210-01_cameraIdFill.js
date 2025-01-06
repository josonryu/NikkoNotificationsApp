/// <reference path="../reference.d.ts" />
App.controller('cameraIdFillController', ['$scope', 'appConst', 'AppBizCom', 'logicCom', '$anchorScroll', '$timeout', '$controller',
    function ($scope, appConst, AppBizCom, logicCom, $anchorScroll, $timeout, $controller) {
        var BACK_SCREEN_ID = '';
        var SCREEN_ID_01 = 'G1210-01';
        var SCREEN_ID_02 = 'G1210-02';
        var SCREEN_ID_03 = 'G1210-03';
        var ERR_MODAL_ID = 'G1020-02'; // エラーモーダル画面
        var BASE64_HEAD = 'data:image/jpeg;base64,';
        var BASE64_HEAD_PNG = 'data:image/png;base64,';
        // ボタン連打防止フラグ
        var stopBtnEventFLG = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };
        // スクロールロック
        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };
        // スクロールアンロック
        var scrollUnlock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
        };
        // エラーモーダル用イベント登録
        $('#' + ERR_MODAL_ID).on('show.bs.modal', () => {
            $('#' + ERR_MODAL_ID).off('shown.bs.modal');
            if ($('body').hasClass('is-modal-open')) {
                $('#' + ERR_MODAL_ID).on('shown.bs.modal', () => {
                    $('body').removeClass('is-modal-open');
                    $('body').addClass('is-modal-open');
                });
            }
            else {
                $('body').addClass('is-modal-open');
            }
        });
        // エラーモーダル用イベント廃棄
        $scope.$on('$destroy', () => {
            $('#' + ERR_MODAL_ID).off('show.bs.modal');
            $('#' + ERR_MODAL_ID).off('shown.bs.modal');
        });
        $scope.appConst = appConst;
        // 共通領域定義 申込みデータ取得
        var comDataApplyInfo = AppBizCom.DataHolder.getNotifInfo();
        // 共通領域定義 撮影画像データ取得
        var comDataPhotoData = AppBizCom.DataHolder.getImageData();
        // 本人確認書類2種類目選択フラグ
        var docChoice2Flg = false;
        // 遷移元画面取得
        var prevPath = AppBizCom.DataHolder.getPrevRoutePath();
        // 取得キー初期化
        var commKey = {
            'frontOrgImageKey': '',
            'backOrgImageKey': '',
            'thirdOrgImageKey': ''
        };
        // 塗りつぶし画像オブジェクトをクリア
        var clearImage = function () {
            $scope.fillImageFromtClass.finalize();
            $scope.fillImageBackClass.finalize();
            $scope.fillImageThirdClass.finalize();
            $scope.fillImageFromtClass = null;
            $scope.fillImageBackClass = null;
            $scope.fillImageThirdClass = null;
            $scope.fillImageClass = null;
        };
        // 初期化処理
        var init = () => {
            // 遷移元により表示、遷移先変更
            var flags = AppBizCom.DataHolder.getFlowControlFlg();
            if (!flags.CAMERA_FLG_CONTROL) {
                flags.CAMERA_FLG_CONTROL = {};
            }
            $scope.editMode = flags.CAMERA_FLG_CONTROL.MOD_FLG;
            // パンくずの表示パターン
            $scope.pankuzuPatten = $scope.editMode ? '4' : '3';
            BACK_SCREEN_ID = prevPath === 'ocrIdResult' ? 'G1190-01' : 'G1190-02';
            // ２種類目撮影状況
            docChoice2Flg = !AppBizCom.InputCheck.isEmpty(comDataPhotoData.HONIN_KAKNIN_SY2_GAZO1);
            // 「次へ」ボタン表示　true:'確認画面へ'　false:'次へ'
            $scope.btnDisplay = prevPath === 'ocrId2Result' ? $scope.editMode : !docChoice2Flg;
            // 本人確認書類1種類目表示時
            if (prevPath === 'ocrIdResult') {
                docChoice2Flg = !AppBizCom.InputCheck.isEmpty(comDataPhotoData.HONIN_KAKNIN_SY2_GAZO1);
                // 2種類目撮影済み、または修正時でない場合
                if (docChoice2Flg || !$scope.editMode) {
                    $scope.btnDisplay = false;
                }
                else {
                    $scope.btnDisplay = true;
                }
            }
            else {
                $scope.btnDisplay = $scope.editMode;
            }
            // キャンバス初期化のためにキャンバスを表示状態にする
            $scope.canvasFrontShow = true;
            $scope.canvasBackShow = true;
            $scope.canvasThirdShow = true;
            // 次へボタンは非活性
            $scope.btnNextDisabled = true;
            // 確認チェックボックス初期値
            $scope.checkboxConfirm1 = false;
            // 自動マスクボタン表示切り替え
            $scope.autoMaskShow = false;
            // 申込データ(事務手続き)取得
            var info = AppBizCom.DataHolder.getNotifInfo();
            var selectedInfo = info.HONIN_KAKNIN_SY_JOHO;
            // 本人確認書類データ取得
            var personDocInfos = null;
            // 選択した本人確認書類マスタデータ取得
            if (prevPath == 'ocrIdResult') {
                personDocInfos = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', selectedInfo.HONIN_KAKNIN_SY_K_1);
            }
            else {
                personDocInfos = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', selectedInfo.HONIN_KAKNIN_SY_K_2);
            }
            // 取得キー(デフォルトベース)
            if (prevPath == 'ocrIdResult') {
                commKey = {
                    // 塗りつぶし前画像
                    'frontOrgImageKey': 'HONIN_KAKNIN_SY1_GAZO1',
                    // 【裏面】
                    // 塗りつぶし前画像
                    'backOrgImageKey': 'HONIN_KAKNIN_SY1_GAZO2',
                    // 【3枚目】
                    // 塗りつぶし前画像
                    'thirdOrgImageKey': 'HONIN_KAKNIN_SY1_GAZO3' // 本人確認書類(1種類目)[3枚目]
                };
            }
            else {
                commKey = {
                    // 塗りつぶし前画像
                    'frontOrgImageKey': 'HONIN_KAKNIN_SY2_GAZO1',
                    // 【裏面】
                    // 塗りつぶし前画像
                    'backOrgImageKey': 'HONIN_KAKNIN_SY2_GAZO2',
                    // 【3枚目】
                    // 塗りつぶし前画像
                    'thirdOrgImageKey': 'HONIN_KAKNIN_SY2_GAZO3' // 本人確認書類(1種類目)[3枚目]
                };
            }
            // 書面名は、本人確認書類から取得
            $scope.title = personDocInfos.MSY;
            // 【表面】
            // 撮影画像をセット
            $scope.idDocFrontimg = BASE64_HEAD + comDataPhotoData[commKey.frontOrgImageKey];
            // マスク画像初期化
            $scope.frontImageFill = appConst.NO_INPUT_VALUE;
            // 【裏面】
            // 裏面画像存在確認
            if (commKey.backOrgImageKey in comDataPhotoData) {
                if (typeof (comDataPhotoData[commKey.backOrgImageKey]) != 'undefined') {
                    $scope.backImageExist = true;
                    // 撮影画像をセット
                    $scope.idDocBackimg = BASE64_HEAD + comDataPhotoData[commKey.backOrgImageKey];
                    // マスク画像初期化
                    $scope.backImageFill = appConst.NO_INPUT_VALUE;
                }
            }
            // 【3枚目】
            // 3枚目画像存在確認
            if (commKey.thirdOrgImageKey in comDataPhotoData) {
                if (typeof (comDataPhotoData[commKey.thirdOrgImageKey]) != 'undefined') {
                    $scope.thirdImageExist = true;
                    // 撮影画像をセット
                    $scope.idDocThirdimg = BASE64_HEAD + comDataPhotoData[commKey.thirdOrgImageKey];
                    // マスク画像初期化
                    $scope.thirdImageFill = appConst.NO_INPUT_VALUE;
                }
            }
            // 画像塗りつぶし描画クラス生成
            var fillImageFromtClass = new AppBizImageFillMask('canvas', "canvasModalScroll", "canvasOrg", "canvasForStLine");
            // Canvasタップ時イベントコールバック関数を登録
            fillImageFromtClass.registCanvasOnTapEvent($scope.tooltipDestroy);
            $scope.fillImageFromtClass = fillImageFromtClass;
            var fillImageBackClass = new AppBizImageFillMask('canvasBack', "canvasBackModalScroll", "canvasBackOrg", "canvasBackForStLine");
            // Canvasタップ時イベントコールバック関数を登録
            fillImageBackClass.registCanvasOnTapEvent($scope.tooltipDestroy);
            $scope.fillImageBackClass = fillImageBackClass;
            var fillImageThirdClass = new AppBizImageFillMask('canvasThird', "canvasThirdModalScroll", "canvasThirdOrg", "canvasThirdForStLine");
            // Canvasタップ時イベントコールバック関数を登録
            fillImageThirdClass.registCanvasOnTapEvent($scope.tooltipDestroy);
            $scope.fillImageThirdClass = fillImageThirdClass;
            // モーダル画面表示時イベント登録
            $("#G1210-02").on("shown.bs.modal", event => {
                if ($scope.fillImageClass == null) {
                    return;
                }
                $scope.fillImageClass.ajustCanvasSize();
                // 自動塗りつぶしボタンを表示する際は、吹き出しツールチップを表示する
                if ($scope.autoMaskShow) {
                    $('[data-toggle="tooltip"]').tooltip('enable').tooltip('show');
                    // 吹き出しツールチップタップ時イベント登録
                    $('div.tooltip').off('click').on('click', function () {
                        // ツールチップ(自動塗りつぶしボタンの吹き出し)を非表示にする
                        $scope.tooltipDestroy();
                        return;
                    });
                }
            });
        };
        // -----「G1210-01:個人番号の塗りつぶし確認画面」イベント-----
        // イベント：初期処理
        $scope.init = () => {
            //画面描画後にスクロールリセット
            $scope.$on('$viewContentLoaded', function () {
                $timeout(function () {
                    $anchorScroll.yOffset = 0;
                    $anchorScroll();
                    $scope.initSwiper();
                    scrollUnlock();
                }, 10);
            });
        };
        // イベント：横スクロール設定
        $scope.initSwiper = () => {
            var galleryThumbs = new Swiper('.gallery-thumbs', {
                slidesPerView: 0,
                watchSlidesVisibility: true,
            });
            var galleryTop = new Swiper('.gallery-top', {
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                thumbs: {
                    swiper: galleryThumbs
                }
            });
        };
        /**
         * イベント：「塗りつぶし」ボタンタップ時
         */
        $scope.maskBtnClick = target => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            scrollLock();
            // 表面塗りつぶしの場合の変数初期化
            $scope.fillImageClass = null;
            $scope.fillImageClass = $scope.fillImageFromtClass;
            // 背景とするCanvas用画像に撮影画像をセット
            var orgImgBase64String = $scope.idDocFrontimg;
            // 裏面塗りつぶしの場合の変数初期化
            if (target === 'back') {
                $scope.fillImageClass = null;
                orgImgBase64String = null;
                $scope.fillImageClass = $scope.fillImageBackClass;
                orgImgBase64String = $scope.idDocBackimg;
            }
            // ３枚目塗りつぶしの場合の変数初期化
            if (target === 'third') {
                $scope.fillImageClass = null;
                orgImgBase64String = null;
                $scope.fillImageClass = $scope.fillImageThirdClass;
                orgImgBase64String = $scope.idDocThirdimg;
            }
            // キャンバス表裏表示判定
            if (target === 'front') {
                $scope.canvasFrontShow = true;
                $scope.canvasBackShow = false;
                $scope.canvasThirdShow = false;
            }
            else if (target === 'back') {
                $scope.canvasFrontShow = false;
                $scope.canvasBackShow = true;
                $scope.canvasThirdShow = false;
            }
            else {
                $scope.canvasFrontShow = false;
                $scope.canvasBackShow = false;
                $scope.canvasThirdShow = true;
            }
            // パラメータ初期化
            $scope.fillImageClass.init();
            var key = '';
            if (target === 'front') {
                key = 'frontImageFill';
            }
            else if (target === 'back') {
                key = 'backImageFill';
            }
            else {
                key = 'thirdImageFill';
            }
            var filledImageData = $scope[key];
            // Canvasに画像セット
            $scope.fillImageClass.setImageData(orgImgBase64String, () => {
                $scope.$applyAsync();
            }, filledImageData);
            // ログ出力
            logicCom.btnTapLog(SCREEN_ID_01, SCREEN_ID_02, '塗りつぶし');
            // モーダル表示
            $('#' + SCREEN_ID_02).modal('show');
            stopBtnEventFLG = false;
            return;
        };
        // イベント：確認チェックボックスタップ時
        $scope.$watch('[checkboxConfirm1]', val => {
            var btnNextDisabled = true;
            // 確認事項1をチェックしている時、「次へ」ボタンを活性にする。
            if ($scope.checkboxConfirm1) {
                btnNextDisabled = false;
            }
            $scope.btnNextDisabled = btnNextDisabled;
            $scope.$applyAsync();
        });
        // イベント：「戻る」ボタンタップ時
        $scope.btnBackClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // モーダル画面表示時イベントの削除
            $("#G1210-02").off('shown.bs.modal');
            // 共通領域定義 申込みデータ取得
            var comDataApplyInfo = AppBizCom.DataHolder.getNotifInfo();
            // アクションログ出力
            logicCom.btnTapLog(SCREEN_ID_01, BACK_SCREEN_ID, '戻る');
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
            // モーダル画面表示時イベントの削除
            $("G1210-02").off('shown.bs.modal');
            // 申込データ（事務手続き）更新
            var info = AppBizCom.DataHolder.getNotifInfo();
            if (prevPath == 'ocrIdResult') {
                info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_MYNO_K = $scope.checkboxConfirm1 === 1 ? '1' : undefined;
            }
            else {
                info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY2_MYNO_K = $scope.checkboxConfirm1 === 1 ? '1' : undefined;
            }
            AppBizCom.DataHolder.setNotifInfo(info);
            // BASE64のヘッダーは不要
            var regExpDelete = new RegExp(BASE64_HEAD_PNG, 'g');
            // 塗りつぶし済み[表]画像をセット
            var frontImageBase64 = typeof ($scope.frontImageFill) != 'undefined' ? $scope.frontImageFill.replace(regExpDelete, '') : appConst.NO_INPUT_VALUE;
            // 塗りつぶし済み[裏]画像をセット
            var backImageBase64 = typeof ($scope.backImageFill) != 'undefined' ? $scope.backImageFill.replace(regExpDelete, '') : appConst.NO_INPUT_VALUE;
            // 塗りつぶし済み[3枚目]画像をセット
            var thirdImageBase64 = typeof ($scope.thirdImageFill) != 'undefined' ? $scope.thirdImageFill.replace(regExpDelete, '') : appConst.NO_INPUT_VALUE;
            // 申し込みデータ共通領域セット
            var comDataPhotoData = AppBizCom.DataHolder.getImageData();
            var imgList = [];
            // 本人確認書類[表]
            // 塗りつぶし済み画像がある場合は、撮影画像と結合させる。
            if (!AppBizCom.InputCheck.isEmpty(frontImageBase64)) {
                var dest = commKey.frontOrgImageKey; // セット先の共通領域項目名
                var org = BASE64_HEAD + comDataPhotoData[dest];
                var filled = BASE64_HEAD_PNG + frontImageBase64;
                imgList.push({ org: org, filled: filled, dest: dest });
            }
            // 本人確認書類[裏]
            // 塗りつぶし済み画像がある場合は、撮影画像と結合させる。
            if (!AppBizCom.InputCheck.isEmpty(backImageBase64)) {
                var dest = commKey.backOrgImageKey; // セット先の共通領域項目名
                var org = BASE64_HEAD + comDataPhotoData[dest];
                var filled = BASE64_HEAD_PNG + backImageBase64;
                imgList.push({ org: org, filled: filled, dest: dest });
            }
            // 本人確認書類[3枚目]
            // 塗りつぶし済み画像がある場合は、撮影画像と結合させる。
            if (!AppBizCom.InputCheck.isEmpty(thirdImageBase64)) {
                var dest = commKey.thirdOrgImageKey; // セット先の共通領域項目名
                var org = BASE64_HEAD + comDataPhotoData[dest];
                var filled = BASE64_HEAD_PNG + thirdImageBase64;
                imgList.push({ org: org, filled: filled, dest: dest });
            }
            var callback = function () {
                // 塗りつぶし画像オブジェクトをクリア
                frontImageBase64 = null;
                backImageBase64 = null;
                thirdImageBase64 = null;
                // 遷移フラグ更新
                var flags = AppBizCom.DataHolder.getFlowControlFlg();
                if (!flags.CAMERA_FLG_CONTROL) {
                    flags.CAMERA_FLG_CONTROL = {};
                }
                if (prevPath == 'ocrIdResult') {
                    flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG = true;
                }
                else if (prevPath == 'ocrId2Result') {
                    flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG2 = true;
                }
                AppBizCom.DataHolder.setFlowControlFlg(flags);
                // ログ出力用項目収集
                var btnName = $scope.btnDisplay ? '確認画面へ' : '次へ';
                info = AppBizCom.DataHolder.getNotifInfo();
                var checkedInfo = info.KAKNIN_SY_CHK_JOHO;
                var result = {};
                if (prevPath == 'ocrIdResult') {
                    result = {
                        'HONIN_KAKNIN_SY1_MYNO_K': { 'value': checkedInfo.HONIN_KAKNIN_SY1_MYNO_K }
                    };
                }
                else {
                    result = {
                        'HONIN_KAKNIN_SY2_MYNO_K': { 'value': checkedInfo.HONIN_KAKNIN_SY2_MYNO_K }
                    };
                }
                // 本人確認書類2種類目の表面画像存在する場合、且つ遷移元が1種類目本人確認書類撮影結果の場合
                if (docChoice2Flg && prevPath === 'ocrIdResult') {
                    // ログ出力
                    logicCom.btnTapLog(SCREEN_ID_01, 'G1190-02', btnName, result);
                    logicCom.locationPath('ocrId2Result', clearImage, callbackFLG, connectionErrorCallback);
                }
                else if ($scope.editMode) {
                    // ログ出力
                    logicCom.btnTapLog(SCREEN_ID_01, 'G1240-01', btnName, result);
                    logicCom.locationPath('applicationConfirm', clearImage, callbackFLG, connectionErrorCallback);
                }
                else {
                    // ログ出力
                    logicCom.btnTapLog(SCREEN_ID_01, 'G1220-01', btnName, result);
                    logicCom.locationPath('applicationConfirmStart', clearImage, callbackFLG, connectionErrorCallback);
                }
            };
            if (imgList.length) {
                // 塗りつぶし済み画像と撮影画像を結合し、共通領域へ保存
                logicCom.setConmbinedImage(imgList, 0, callback);
            }
            else {
                callback();
            }
        };
        // -----「G1210-02:個人番号の塗りつぶし画面」イベント-----
        /**
         * イベント：「全てクリア」ボタンタップ時
         */
        $scope.allClearBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            $scope.fillImageClass.allClear();
            // アクションログ出力
            // logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_02, LOG_BTN_ITEM2.ITEM_1);
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント：「フリー」ボタンタップ時
         */
        $scope.freeLineBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 線種をフリーモードに切り替え
            $scope.fillImageClass.changeLineMode(1);
            // アクションログ出力
            // logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_02, LOG_BTN_ITEM2.ITEM_2);
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント：「直線」ボタンタップ時
         */
        $scope.stLineBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 線種を直線モードに切り替え
            $scope.fillImageClass.changeLineMode(2);
            // アクションログ出力
            // logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_02, LOG_BTN_ITEM2.ITEM_3);
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント：「消しゴム」ボタンタップ時
         */
        $scope.eraserModeBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 消しゴムモードON
            $scope.fillImageClass.changeEraserMode(true);
            // アクションログ出力
            // logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_02, LOG_BTN_ITEM2.ITEM_4);
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント：「太さ：細」ボタンタップ時
         */
        $scope.lineSmallBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 「太さ：細」
            $scope.fillImageClass.changeLineWidth(1);
            // アクションログ出力
            // logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_02, LOG_BTN_ITEM2.ITEM_5);
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント「太さ：中」ボタンタップ時
         */
        $scope.lineNormalBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 「太さ：中」
            $scope.fillImageClass.changeLineWidth(2);
            // アクションログ出力
            // logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_02, LOG_BTN_ITEM2.ITEM_6);
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント：「太さ：太」ボタンタップ時
         */
        $scope.lineBoldBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 「太さ：太」
            $scope.fillImageClass.changeLineWidth(3);
            // アクションログ出力
            // logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_02, LOG_BTN_ITEM2.ITEM_7);
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント：「画像拡大」ボタンタップ時
         */
        $scope.imageScaleBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // アクションログ出力
            logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_03, '画像拡大');
            // 拡大モードON
            $scope.fillImageClass.changeScaleMode(true);
            $scope.$applyAsync();
            // Canvasサイズ調整
            $timeout(function () {
                $scope.fillImageClass.ajustCanvasSize();
            }, 0);
            // TODO: ポップアップの表示時間確認用ログ（IT用）
            logicCom.debugLog("性能確認用：画像拡大表示完了");
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント：「戻る」ボタンタップ時
         */
        $scope.modalBackBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // アクションログ出力
            logicCom.btnTapLog(SCREEN_ID_03, SCREEN_ID_02, '戻る');
            // 拡大モードOFF
            $scope.fillImageClass.changeScaleMode(false);
            // Canvasサイズ調整
            $timeout(() => {
                $scope.fillImageClass.ajustCanvasSize();
            }, 0);
            // TODO: ポップアップの表示時間確認用ログ（IT用）
            logicCom.debugLog("性能確認用：画像拡大表示解除");
            stopBtnEventFLG = false;
            return;
        };
        /**
         * イベント：「キャンセル」ボタンタップ時
         */
        $scope.cancelBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            scrollUnlock();
            $scope.canvasFrontShow = false;
            $scope.canvasBackShow = false;
            $scope.canvasThirdShow = false;
            $scope.fillImageClass.resetFillImage();
            // アクションログ出力
            logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_01, 'キャンセル');
            // モーダル非表示
            $('#' + SCREEN_ID_02).modal('hide');
            stopBtnEventFLG = false;
            return;
        };
        // イベント：「確定」ボタンタップ時
        $scope.closeBtnClick = () => {
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            scrollUnlock();
            var base64Data = $scope.fillImageClass.getImageData();
            if ($scope.canvasFrontShow) {
                $scope.frontImageFill = base64Data;
            }
            else if ($scope.canvasBackShow) {
                $scope.backImageFill = base64Data;
            }
            else {
                $scope.thirdImageFill = base64Data;
            }
            base64Data = null;
            // 塗りつぶし確定でチェックボックスをクリアしボタンを非活性状態に戻す
            $scope.btnNextDisabled = true;
            $scope.checkboxConfirm1 = false;
            $scope.$applyAsync();
            // アクションログ出力
            logicCom.btnTapLog(SCREEN_ID_02, SCREEN_ID_01, '確定');
            // モーダル非表示
            $('#' + SCREEN_ID_02).modal('hide');
            stopBtnEventFLG = false;
        };
        // ツールチップ(自動塗りつぶしボタンの吹き出し)を非表示にする
        $scope.tooltipDestroy = () => {
            // 吹き出しツールチップタップ時イベント解除
            $('div.tooltip').off('click');
            $('[data-toggle="tooltip"]').tooltip('hide').tooltip('disable');
        };
        init();
    }
]);
