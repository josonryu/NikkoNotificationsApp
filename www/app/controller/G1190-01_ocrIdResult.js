/// <reference path="../reference.d.ts" />
App.controller('ocrIdResultController', ['$scope', '$controller', 'appConst', 'AppBizCom', 'logicCom', '$anchorScroll', '$timeout', 'AppBizCamera',
    function ($scope, $controller, appConst, AppBizCom, logicCom, $anchorScroll, $timeout, AppBizCamera) {
        // エラーモーダル用共通コントローラ
        $controller('errorInfoModalCtrl', { $scope: $scope });
        // 画面ID定義
        var MAIN_PAGE_ID = 'G1190-01';
        var SHOOTING_PAGE_ID = 'G1170-01';
        var EXPANTION_PAGE_ID = 'G1200-01';
        var CONFIRM_MODAL_ID = 'G1190-03';
        var FILL_PAGE_ID = 'G1210-01';
        var ERR_MODAL_ID = 'G1020-02'; // エラーモーダル画面
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
        $scope.initConfirm = () => {
            // イベント登録
            $('#' + CONFIRM_MODAL_ID).on('show.bs.modal', () => {
                $('body').addClass('is-modal-open');
            });
            $('#' + CONFIRM_MODAL_ID).on('hidden.bs.modal', () => {
                $('body').removeClass('is-modal-open');
            });
            // イベント廃棄
            $scope.$on('$destroy', () => {
                $('#' + CONFIRM_MODAL_ID).off('show.bs.modal');
                $('#' + CONFIRM_MODAL_ID).off('hidden.bs.modal');
            });
        };
        // エラーモーダル用
        var ERR_LOG_MESSAGE_ID = 'KKAP-CM000-07E';
        var ERR_TITLE = AppBizCom.Msg.getMsg('KKAP-CM000-06E', []);
        var ERR_CONTENTS = AppBizCom.Msg.getMsg('KKAP-CM000-07E', []);
        // 申込データ(事務手続き)取得
        var info = AppBizCom.DataHolder.getNotifInfo();
        var selectedNumInfo = info.MNSYSEIRY_JOHO ? info.MNSYSEIRY_JOHO.MNSYSEIRY_K : undefined;
        // 本人確認書類データ取得
        var selectedInfo = info.HONIN_KAKNIN_SY_JOHO;
        var personDocInfos = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', selectedInfo.HONIN_KAKNIN_SY_K_1);
        // 塗りつぶし対象書面フラグ
        var isFillImage = false;
        // 塗りつぶし画面スキップフラグ
        var skipMaskFlg = false;
        // 自動マスク画像情報の有無
        $scope.isAutoFillFrontImage = false;
        $scope.isAutoFillBackImage = false;
        $scope.isAutoFillImage = false;
        // 自動マスク画像表示/非表示
        $scope.showAutoFillFrontImage = false;
        $scope.showAutoFillBackImage = false;
        // スイッチコントロール初期状態
        $scope.switch = true;
        // 本人確認書類2種類目選択フラグ
        var docChoice2Flg = false;
        var BASE64_HEAD = 'data:image/jpeg;base64,';
        var BASE64_HEAD_PNG = 'data:image/png;base64,';
        // 自動塗りつぶし画像設定処理
        var setFillImages = () => {
            // 共通領域定義 撮影画像データ取得
            var comDataPhotoData = AppBizCom.DataHolder.getImageData();
            // 【表面】
            $scope.frontImageExist = true;
            // 撮影画像をセット
            $scope.idDocFrontimg = 'data:image/jpeg;base64,' + comDataPhotoData.HONIN_KAKNIN_SY1_GAZO1;
            // 自動マスク画像が存在する場合
            if (typeof (comDataPhotoData.AUTO_FILL_GAZO1) != 'undefined') {
                $scope.isAutoFillFrontImage = true;
                // 自動マスク画像をセット
                $scope.frontImageFill = BASE64_HEAD_PNG + comDataPhotoData.AUTO_FILL_GAZO1;
            }
            else {
                $scope.isAutoFillFrontImage = false;
                // 自動マスク画像をセット
                $scope.frontImageFill = appConst.NO_INPUT_VALUE;
                $("#frontImageFill").removeAttr('src');
            }
            // 【裏面】
            // 裏面画像存在確認
            if (typeof (comDataPhotoData.HONIN_KAKNIN_SY1_GAZO2) != 'undefined') {
                $scope.backImageExist = true;
                // 撮影画像をセット
                $scope.idDocBackimg = 'data:image/jpeg;base64,' + comDataPhotoData.HONIN_KAKNIN_SY1_GAZO2;
                // 自動マスク画像が存在する場合
                if (typeof (comDataPhotoData.AUTO_FILL_GAZO2) != 'undefined') {
                    $scope.isAutoFillBackImage = true;
                    // 自動マスク画像をセット
                    $scope.backImageFill = BASE64_HEAD_PNG + comDataPhotoData.AUTO_FILL_GAZO2;
                }
                else {
                    $scope.isAutoFillBackImage = false;
                    // 自動マスク画像をセット
                    $scope.backImageFill = appConst.NO_INPUT_VALUE;
                    $('#backImageFill').removeAttr('src');
                }
            }
            // }
            // 【3枚目】
            // 3枚目画像存在確認
            if (typeof (comDataPhotoData.HONIN_KAKNIN_SY1_GAZO3) != 'undefined') {
                $scope.thirdImageExist = true;
                // 撮影画像をセット
                $scope.idDocThirdimg = 'data:image/jpeg;base64,' + comDataPhotoData.HONIN_KAKNIN_SY1_GAZO3;
            }
            // 自動マスク画像が存在する場合
            if ($scope.isAutoFillFrontImage || $scope.isAutoFillBackImage) {
                // 表示設定
                $scope.isAutoFillImage = true;
                $scope.switch = true;
            }
            else {
                // 表示設定
                $scope.isAutoFillImage = false;
                $scope.switch = false;
            }
            // 自動マスク画像表示設定
            $scope.showAutoFillFrontImage = $scope.isAutoFillFrontImage;
            $scope.showAutoFillBackImage = $scope.isAutoFillBackImage;
        };
        // 初期処理
        var init = () => {
            $scope.appConst = appConst;
            // 初期表示設定
            $scope.title = personDocInfos.MSY;
            $scope.frontImageExist = true;
            // 遷移元により遷移先変更
            var flags = AppBizCom.DataHolder.getFlowControlFlg();
            if (!flags.CAMERA_FLG_CONTROL) {
                flags.CAMERA_FLG_CONTROL = {};
            }
            $scope.editMode = flags.CAMERA_FLG_CONTROL.MOD_FLG;
            skipMaskFlg = flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG;
            // パンくずの表示パターン
            $scope.pankuzuPatten = $scope.editMode ? '4' : '3';
            // 個人番号カード選択有無
            $scope.isMynumber = personDocInfos.CD === '01';
            // 表示モード設定
            $scope.isSwiperMode = personDocInfos.STM3.length >= 3;
            // 「書類選択へ戻る」ボタン表示処理
            $scope.isShowBackBtn = ($scope.editMode && selectedNumInfo === '1') ? false : true;
            // 手動塗りつぶし対象書面判定
            if (personDocInfos.CD === '07' ||
                personDocInfos.CD === '12' ||
                personDocInfos.CD === '14' ||
                personDocInfos.CD === '15') {
                isFillImage = true;
            }
            // 共通領域定義 撮影画像データ取得
            var comDataPhotoData = AppBizCom.DataHolder.getImageData();
            // 本人確認書類2種類目の表面画像存在確認
            if (AppBizCom.InputCheck.isEmpty(comDataPhotoData.HONIN_KAKNIN_SY2_GAZO1)) {
                docChoice2Flg = false;
                // ボタン表示制御
                // 塗りつぶし対象書面でない且つ、確認画面からの遷移の場合true(「確認画面へ」)
                $scope.btnDisplay = isFillImage ? false : $scope.editMode;
            }
            else {
                docChoice2Flg = true;
                // ボタン表示制御
                $scope.btnDisplay = false;
            }
            // 次へボタンは非活性
            $scope.btnNextDisabled = true;
            $scope.checkboxConfirm1 = false;
            $scope.checkboxConfirm2 = false;
            $scope.checkboxConfirm3 = false;
            // 自動マスク画像セット
            setFillImages();
            // 撮影開始画面指定
            $scope.noneInitCamFlg = true;
            $scope.noneInitCamOcrFlg = true;
            // カメラ初期化
            AppBizCamera.initCamScan(
            // 初期化成功時
            () => {
                // 初期化成功した場合は false
                $scope.noneInitCamFlg = false;
                $scope.$applyAsync();
            }, 
            // 初期化失敗時
            error => {
                // エラーダイアログを表示する
                $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                // ログ出力
                logicCom.errorLog('カメラ初期化エラー', error);
                // カメラプラグイン終了
                AppBizCamera.deinitCamScan(() => { }, () => { });
            });
            // ocr 初期化
            AppBizCamera.initCamOcr(
            // 初期化成功時
            () => {
                // 初期化成功した場合は false
                $scope.noneInitCamOcrFlg = false;
                $scope.$applyAsync();
            },
            // 初期化失敗時
            error => {
                // エラーダイアログを表示する
                $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                // ログ出力
                logicCom.errorLog('カメラOCR初期化エラー', error);
                // カメラプラグイン終了
                AppBizCamera.deinitCamOcr(() => { }, () => { });
            });
        };
        // -----「G1190-01:撮影結果確認（1種類目）画面」イベント-----
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
         * イベント：スイッチコントロール初期表示処理
         */
        $scope.addSwitchClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            $scope.showSwitch = !$scope.showSwitch;
            stopBtnEventFLG = false;
        };
        /**
        * イベント：スイッチコントロールタップ時
        */
        $scope.maskBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 表面自動マスク画像表示切替
            $scope.showAutoFillFrontImage = !$scope.showAutoFillFrontImage;
            // 裏面自動マスク画像表示切替
            $scope.showAutoFillBackImage = !$scope.showAutoFillBackImage;
            stopBtnEventFLG = false;
        };
        /**
         * イベント：「再撮影」ボタンタップ時
         */
        $scope.takeRetry = target => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 「G1170-01：カメラ撮影（本人確認書類）画面」表示設定
            // 撮影ガイド設定（顔写真位置）
            $scope.guideType = personDocInfos.CD;
            // タイトル設定
            var titleSuffix = '';
            var targetItem = '';
            if (target == 'front') {
                $scope.popupMode = 'FRONT';
                if (personDocInfos.STM3 && personDocInfos.STM3.length < 3 && personDocInfos.CD !== '03' && personDocInfos.CD !== '13') {
                    titleSuffix = appConst.CAM_TITLE_SUFF.FRONT_NAME;
                }
                else {
                    titleSuffix = appConst.CAM_TITLE_SUFF.FIRST_NAME;
                }
                targetItem = 'HONIN_KAKNIN_SY1_GAZO1';
            }
            else if (target == 'back') {
                $scope.popupMode = 'BACK';
                if (personDocInfos.STM3 && personDocInfos.STM3.length < 3 && personDocInfos.CD !== '03' && personDocInfos.CD !== '13') {
                    titleSuffix = appConst.CAM_TITLE_SUFF.BACK_NAME;
                }
                else {
                    titleSuffix = appConst.CAM_TITLE_SUFF.SECOND_NAME;
                }
                targetItem = 'HONIN_KAKNIN_SY1_GAZO2';
            }
            else if (target == 'third') {
                $scope.popupMode = 'THIRD';
                titleSuffix = appConst.CAM_TITLE_SUFF.THIRD_NAME;
                targetItem = 'HONIN_KAKNIN_SY1_GAZO3';
            }
            $scope.cameraTitle = personDocInfos.MSY + ' ' + titleSuffix;
            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, SHOOTING_PAGE_ID, '再撮影');
            // 「G1170-01：カメラ撮影（本人確認書類）画面」表示
            logicCom.change2CameraPreview(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
            // OCR対象書面の場合
            if ((personDocInfos.CD == '01' && target == 'front') ||
                (personDocInfos.CD == '02' && target == 'front') ||
                (personDocInfos.CD == '04' && target == 'front') ||
                (personDocInfos.CD == '05' && target == 'front')) {
                AppBizCamera.startCamOcr(
                // 撮影成功時
                camInfo => {
                    // 共通領域へ保存
                    var imageData = AppBizCom.DataHolder.getImageData();
                    // 画像データ設定
                    imageData[targetItem] = camInfo.image;
                    AppBizCom.DataHolder.setImageData(imageData);
                    // 撮影モードが自動モードの場合
                    if (camInfo.mode == 1) {
                        // 個人番号カード（表面）、または運転免許証（表面）の場合自動マスク処理
                        if (personDocInfos.CD == '01') {
                            logicCom.autoMask(1, 1);
                        }
                        else if (personDocInfos.CD == '02') {
                            logicCom.autoMask(2, 1);
                        }
                    }
                    else {
                        // 自動マスク情報クリア
                        imageData = AppBizCom.DataHolder.getImageData();
                        imageData.AUTO_FILL_GAZO1 = undefined;
                        AppBizCom.DataHolder.setImageData(imageData);
                    }
                    //  OCR結果保存
                    // logicCom.setOcrResult2DataHolder(camInfo,
                    //     (): void => {
                    // 再撮影を反映
                    $scope.idDocFrontimg = 'data:image/jpeg;base64,' + camInfo.image;
                    $scope.frontImageExist = true;
                    // 画面更新
                    setFillImages();
                    $scope.btnNextDisabled = true;
                    $scope.checkboxConfirm1 = false;
                    $scope.checkboxConfirm2 = false;
                    $scope.checkboxConfirm3 = false;
                    $scope.$applyAsync();
                    // ログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラOCR撮影成功');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    stopBtnEventFLG = false;
                    //     },
                    //     error => {
                    //         // 失敗時
                    //         // エラーダイアログを表示する
                    //         $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    //         // ログ出力
                    //         logicCom.errorLog('OCR結果設定エラー', error);
                    //         logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    //         // カメラプラグイン終了
                    //         AppBizCom.Camera.deinitCamScan((): void => {}, (): void => {});
                    //     }
                    // );
                },
                // エラー発生時
                error => {
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // ログ出力
                    logicCom.callbackErrLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラOCR撮影エラー');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    // カメラプラグイン終了
                    AppBizCom.Camera.deinitCamOcr(() => { }, () => { });
                    stopBtnEventFLG = false;
                },
                // キャンセル時
                () => {
                    // ログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'cancelCallBack', 'カメラOCR撮影キャンセル');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    stopBtnEventFLG = false;
                });
            }
            else {
                AppBizCamera.startCamScan(
                // 撮影成功時
                camInfo => {
                    // 共通領域へ保存
                    var imageData = AppBizCom.DataHolder.getImageData();
                    // 画像データ設定
                    imageData[targetItem] = camInfo.image;
                    AppBizCom.DataHolder.setImageData(imageData);
                    // 運転免許証（裏面）自動マスク処理
                    if (personDocInfos.CD === '02' && camInfo.mode == 1) {
                        logicCom.autoMask(2, 2);
                    }
                    else {
                        // 自動マスク情報クリア
                        imageData = AppBizCom.DataHolder.getImageData();
                        imageData.AUTO_FILL_GAZO2 = undefined;
                        AppBizCom.DataHolder.setImageData(imageData);
                    }
                    // フラグ情報更新
                    var flags = AppBizCom.DataHolder.getFlowControlFlg();
                    flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG = false;
                    AppBizCom.DataHolder.setFlowControlFlg(flags);
                    skipMaskFlg = flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG;
                    // 再撮影を反映
                    if (target === 'front') {
                        $scope.idDocFrontimg = 'data:image/jpeg;base64,' + camInfo.image;
                        $scope.frontImageExist = true;
                    }
                    else if (target === 'back') {
                        $scope.idDocBackimg = 'data:image/jpeg;base64,' + camInfo.image;
                        $scope.backImageExist = true;
                    }
                    else {
                        $scope.idDocThirdimg = 'data:image/jpeg;base64,' + camInfo.image;
                        $scope.thirdImageExist = true;
                    }
                    // 画面更新
                    setFillImages();
                    $scope.btnNextDisabled = true;
                    $scope.checkboxConfirm1 = false;
                    $scope.checkboxConfirm2 = false;
                    $scope.checkboxConfirm3 = false;
                    $scope.$applyAsync();
                    // ログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラ撮影成功');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    stopBtnEventFLG = false;
                }, 
                // エラー発生時
                error => {
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // アクションログ出力
                    logicCom.callbackErrLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラ撮影エラー');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    // カメラプラグイン終了
                    AppBizCamera.deinitCamScan(() => { }, () => { });
                    stopBtnEventFLG = false;
                }, 
                // キャンセル時
                () => {
                    // アクションログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'cancellCallBack', 'カメラ撮影キャンセル');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    stopBtnEventFLG = false;
                });
            }
        };
        /**
        * イベント：確認チェックボックスタップ時
        */
        $scope.$watch('[checkboxConfirm1,checkboxConfirm2,checkboxConfirm3]', val => {
            var btnNextDisabled = true;
            if (val[0] && val[1]) {
                if ($scope.isAutoFillImage) {
                    if (val[2]) {
                        btnNextDisabled = false;
                    }
                }
                else {
                    btnNextDisabled = false;
                }
            }
            $scope.btnNextDisabled = btnNextDisabled;
            $scope.$applyAsync();
        });
        /**
         * イベント：「書類選択へ戻る」ボタンクリック
         */
        $scope.backBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            scrollLock();
            // アクションログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, CONFIRM_MODAL_ID, '書類選択へ戻る');
            // モーダル表示
            $('#' + CONFIRM_MODAL_ID).modal('show');
            stopBtnEventFLG = false;
        };
        // イベント：「次へ」ボタンタップ時
        $scope.nextBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 申込データ（事務手続き）更新
            var info = AppBizCom.DataHolder.getNotifInfo();
            if (!info.KAKNIN_SY_CHK_JOHO) {
                info.KAKNIN_SY_CHK_JOHO = {};
            }
            info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_YMTR_K = $scope.checkboxConfirm1 === 1 ? '1' : '0';
            info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_UTRK_K = $scope.checkboxConfirm2 === 1 ? '1' : '0';
            if ($scope.isAutoFillImage) {
                info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_NRTB_K = $scope.checkboxConfirm3 === 1 ? '1' : '0';
                info.KAKNIN_SY_CHK_JOHO.JIDO_NRTBS_KJY = $scope.switch ? '0' : '1';
            }
            else {
                info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_NRTB_K = undefined;
                info.KAKNIN_SY_CHK_JOHO.JIDO_NRTBS_KJY = undefined;
            }
            info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY1_SINKYU_K = undefined;
            AppBizCom.DataHolder.setNotifInfo(info);
            var callback = function () {
                // ログ出力用入力項目収集
                var btnName = $scope.btnDisplay ? '確認画面へ' : '次へ';
                info = AppBizCom.DataHolder.getNotifInfo();
                var checkedInfo = info.KAKNIN_SY_CHK_JOHO;
                var result = {
                    'HONIN_KAKNIN_SY1_YMTR_K': { 'value': checkedInfo.HONIN_KAKNIN_SY1_YMTR_K },
                    'HONIN_KAKNIN_SY1_UTRK_K': { 'value': checkedInfo.HONIN_KAKNIN_SY1_UTRK_K },
                };
                if ($scope.isAutoFillImage) {
                    result.HONIN_KAKNIN_SY1_NRTB_K = { 'value': checkedInfo.HONIN_KAKNIN_SY1_NRTB_K };
                    result.JIDO_NRTBS_KJY = { 'value': checkedInfo.JIDO_NRTBS_KJY };
                }
                result.HONIN_KAKNIN_SY1_SINKYU_K = { 'value': checkedInfo.HONIN_KAKNIN_SY1_SINKYU_K };
                // 塗りつぶし対象書面選択時
                if (isFillImage && !skipMaskFlg) {
                    // ログ出力
                    logicCom.btnTapLog(MAIN_PAGE_ID, FILL_PAGE_ID, btnName, result);
                    // 塗りつぶし画面へ遷移
                    logicCom.locationPath('cameraIdFill', callbackFLG, callbackFLG, connectionErrorCallback);
                }
                else if (docChoice2Flg) {
                    // ログ出力
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-02', btnName, result);
                    logicCom.locationPath('ocrId2Result', callbackFLG, callbackFLG, connectionErrorCallback);
                }
                else if ($scope.editMode) {
                    // ログ出力
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1240-01', btnName, result);
                    logicCom.locationPath('applicationConfirm', callbackFLG, callbackFLG, connectionErrorCallback);
                }
                else {
                    // ログ出力
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1220-01', btnName, result);
                    logicCom.locationPath('applicationConfirmStart', callbackFLG, callbackFLG, connectionErrorCallback);
                }
            };
            // 自動塗りつぶし合成処理
            if ($scope.isAutoFillImage) {
                // 画像情報更新
                // BASE64のヘッダーは不要
                var regExpDelete = new RegExp(BASE64_HEAD_PNG, 'g');
                // 塗りつぶし済み[表]画像をセット
                var frontImageBase64 = typeof ($scope.frontImageFill) != 'undefined' ? $scope.frontImageFill.replace(regExpDelete, '') : appConst.NO_INPUT_VALUE;
                // 塗りつぶし済み[裏]画像をセット
                var backImageBase64 = typeof ($scope.backImageFill) != 'undefined' ? $scope.backImageFill.replace(regExpDelete, '') : appConst.NO_INPUT_VALUE;
                // 申し込みデータ共通領域取得
                var imageData = AppBizCom.DataHolder.getImageData();
                var imgList = [];
                // 本人確認書類[表]
                // 塗りつぶし済み画像が存在し、表示されている場合、撮影画像と結合させる。
                if (!AppBizCom.InputCheck.isEmpty(frontImageBase64) && $scope.showAutoFillFrontImage) {
                    var dest = 'HONIN_KAKNIN_SY1_GAZO1'; // セット先の共通領域項目名
                    var org = BASE64_HEAD + imageData[dest];
                    var filled = BASE64_HEAD_PNG + frontImageBase64;
                    imgList.push({ org: org, filled: filled, dest: dest });
                }
                // 本人確認書類[裏]
                // 塗りつぶし済み画像が存在し、表示されている場合、撮影画像と結合させる。
                if (!AppBizCom.InputCheck.isEmpty(backImageBase64) && $scope.showAutoFillBackImage) {
                    var dest = 'HONIN_KAKNIN_SY1_GAZO2'; // セット先の共通領域項目名
                    var org = BASE64_HEAD + imageData[dest];
                    var filled = BASE64_HEAD_PNG + backImageBase64;
                    imgList.push({ org: org, filled: filled, dest: dest });
                }
                // 自動マスク画像初期化
                imageData.AUTO_FILL_GAZO1 = undefined;
                imageData.AUTO_FILL_GAZO2 = undefined;
                // 共通領域セット
                AppBizCom.DataHolder.setImageData(imageData);
                frontImageBase64 = undefined;
                backImageBase64 = undefined;
                if (imgList.length) {
                    // 塗りつぶし済み画像と撮影画像を結合し、共通領域へ保存
                    logicCom.setConmbinedImage(imgList, 0, callback);
                }
                else {
                    callback();
                }
            }
            else {
                callback();
            }
        };
        /**
         * イベント：「画像拡大」ボタンタップ時
         */
        $scope.imgExpansion = target => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            scrollLock();
            $scope.frontBack = target;
            $scope.exAutoFillImage = false;
            //  画像の高さ、幅
            var imgHeight = undefined;
            var imgWidth = undefined;
            var logParam = '';
            // 表面の場合
            if (target == 'front') {
                if (personDocInfos.STM3 && personDocInfos.STM3.length < 3 && personDocInfos.CD !== '03' && personDocInfos.CD !== '13') {
                    $scope.side = appConst.CAM_TITLE_SUFF.FRONT_NAME;
                }
                else {
                    $scope.side = appConst.CAM_TITLE_SUFF.FIRST_NAME;
                }
                $scope.expansionImg = $scope.idDocFrontimg;
                // 自動マスク画像が表示されている場合
                if ($scope.showAutoFillFrontImage) {
                    $scope.exAutoFillImage = true;
                    $scope.exImageFill = $scope.frontImageFill;
                }
                // アプリケーションログ
                imgHeight = $('#expansion').height();
                imgWidth = $('#expansion').width();
                logParam = imgHeight.toString + '/' + imgWidth;
            }
            else if (target == 'back') {
                if (personDocInfos.STM3 && personDocInfos.STM3.length < 3 && personDocInfos.CD !== '03' && personDocInfos.CD !== '13') {
                    $scope.side = appConst.CAM_TITLE_SUFF.BACK_NAME;
                }
                else {
                    $scope.side = appConst.CAM_TITLE_SUFF.SECOND_NAME;
                }
                $scope.expansionImg = $scope.idDocBackimg;
                // 自動マスク画像が表示されている場合
                if ($scope.showAutoFillBackImage) {
                    $scope.exAutoFillImage = true;
                    $scope.exImageFill = $scope.backImageFill;
                }
                // アプリケーションログ
                imgHeight = $('#expansion').height();
                imgWidth = $('#expansion').width();
                logParam = imgHeight + '/' + imgWidth;
            }
            else if (target == 'third') {
                $scope.side = appConst.CAM_TITLE_SUFF.THIRD_NAME;
                $scope.expansionImg = $scope.idDocThirdimg;
                // アプリケーションログ
                imgHeight = $('#expansion').height();
                imgWidth = $('#expansion').width();
                logParam = imgHeight + '/' + imgWidth;
            }
            // アプリケーションログ
            logicCom.debugLog('元画像の高さ/幅：', logParam);
            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, EXPANTION_PAGE_ID, '画像拡大');
            // モーダル表示
            $('#expansionModal').modal('show');
            // アプリケーションログ
            imgHeight = $('#expansion').height();
            imgWidth = $('#expansion').width();
            logParam = imgHeight + '/' + imgWidth;
            logicCom.debugLog('拡大画像の高さ/幅：', logParam);
            stopBtnEventFLG = false;
        };
        // -----「G1200-01:撮影結果拡大画面」イベント-----
        /**
         * イベント：「閉じる」ボタンタップ時
         */
        $scope.closeBtnClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            scrollUnlock();
            // ログ出力
            logicCom.btnTapLog(EXPANTION_PAGE_ID, MAIN_PAGE_ID, '閉じる');
            $('#expansionModal').modal('hide');
            stopBtnEventFLG = false;
        };
        // -----「G1190-03:撮影結果確認（書類再選択確認）画面」イベント-----
        /**
         * イベント：「いいえ」ボタンタップ時
         */
        $scope.backBtnClickNo = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            scrollUnlock();
            // アクションログ出力
            logicCom.btnTapLog(CONFIRM_MODAL_ID, MAIN_PAGE_ID, 'いいえ');
            // モーダル非表示
            $('#' + CONFIRM_MODAL_ID).modal('hide');
            stopBtnEventFLG = false;
        };
        /**
         * イベント：「はい」ボタンタップ時
         */
        $scope.backBtnClickYes = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            scrollUnlock();
            var successCallBack = function () {
                // 申込データ(事務手続き)取得
                var applyInfo = AppBizCom.DataHolder.getNotifInfo();
                // 番号確認書類区分が個人番号カードの場合
                if (selectedNumInfo === '1') {
                    // 本人確認書類情報初期化
                    applyInfo.HONIN_KAKNIN_SY_JOHO = {
                        HONIN_KAKNIN_SY_K_1: undefined,
                        HONIN_KAKNIN_SY_YUSO_K_1: undefined,
                        HONIN_KAKNIN_SY_K_2: undefined,
                        HONIN_KAKNIN_SY_YUSO_K_2: undefined
                    };
                }
                // 確認書類チェック情報初期化
                applyInfo.KAKNIN_SY_CHK_JOHO = {
                    HONIN_KAKNIN_SY1_YMTR_K: undefined,
                    HONIN_KAKNIN_SY1_UTRK_K: undefined,
                    HONIN_KAKNIN_SY1_SINKYU_K: undefined,
                    HONIN_KAKNIN_SY1_NRTB_K: undefined,
                    HONIN_KAKNIN_SY2_YMTR_K: undefined,
                    HONIN_KAKNIN_SY2_UTRK_K: undefined,
                    HONIN_KAKNIN_SY2_SINKYU_K: undefined,
                    JIDO_NRTBS_KJY: undefined,
                    HONIN_KAKNIN_SY1_MYNO_K: undefined,
                    HONIN_KAKNIN_SY2_MYNO_K: undefined // 本人確認書類（2種類目）個人番号記載確認区分
                };
                // 申込データ(事務手続き)設定
                AppBizCom.DataHolder.setNotifInfo(applyInfo);
                // 「撮影画像データ」初期化
                var imageData = AppBizCom.DataHolder.getImageData();
                imageData.HONIN_KAKNIN_SY1_GAZO1 = undefined; // 本人確認書類1種類目画像1
                imageData.HONIN_KAKNIN_SY1_GAZO2 = undefined; // 本人確認書類1種類目画像2
                imageData.HONIN_KAKNIN_SY1_GAZO3 = undefined; // 本人確認書類1種類目画像3
                imageData.HONIN_KAKNIN_SY2_GAZO1 = undefined; // 本人確認書類2種類目画像1
                imageData.HONIN_KAKNIN_SY2_GAZO2 = undefined; // 本人確認書類2種類目画像2
                imageData.HONIN_KAKNIN_SY2_GAZO3 = undefined; // 本人確認書類2種類目画像3
                imageData.AUTO_FILL_GAZO1 = undefined; // 自動塗りつぶし画像1
                imageData.AUTO_FILL_GAZO2 = undefined; // 自動塗りつぶし画像2
                AppBizCom.DataHolder.setImageData(imageData);
                // 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
                // 「OCR結果データ」初期化
                var ocrData = AppBizCom.DataHolder.getOcrData();
                ocrData = {
                    MODE: undefined,
                    CARD_TYPE: undefined // カードタイプ
                };
                AppBizCom.DataHolder.setOcrData(ocrData);
                // 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
                // 遷移フラグの更新
                var flags = AppBizCom.DataHolder.getFlowControlFlg();
                if (!flags.CAMERA_FLG_CONTROL) {
                    flags.CAMERA_FLG_CONTROL = {};
                }
                flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG = false;
                flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG2 = false;
                AppBizCom.DataHolder.setFlowControlFlg(flags);
            };
            var path = '';
            if ($scope.editMode) {
                path = 'selectIdentificationDoc';
            }
            else {
                // 個人番号カード選択の有無により遷移先変更
                path = selectedNumInfo === '1' ? 'selectNecessaryDoc' : 'selectIdentificationDoc';
            }
            // ログ出力
            var PREV_PAGE_ID = selectedNumInfo === '1' ? 'G1100-01' : 'G1140-01';
            logicCom.btnTapLog(CONFIRM_MODAL_ID, PREV_PAGE_ID, 'はい');
            $('#' + CONFIRM_MODAL_ID).modal('hide');
            $('body').removeClass('is-modal-open');
            logicCom.locationPath(path, successCallBack, callbackFLG, connectionErrorCallback);
        };
        init();
    }]);
