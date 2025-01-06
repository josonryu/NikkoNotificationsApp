// <reference path="../reference.d.ts" />

App.controller('cameraDescriptionController', ['$scope', '$controller', 'AppBizCom', 'logicCom',
    function ($scope, $controller, AppBizCom,logicCom) {
        // 画面ID定義
        var MAIN_PAGE_ID: string = 'G1150-01';       // 撮影開始説明画面
        var DISPLAY_MODAL_ID: string = 'G1160-01';   // 撮影書面表示画面
        var PRE_PAGE_ID: string = '';
        var ERR_MODAL_ID: string = 'G1020-02';       // エラーモーダル画面

        // ボタン連打防止フラグ
        var stopBtnEventFLG: boolean = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };

        // エラーモーダル用イベント登録
        $('#' + ERR_MODAL_ID).on('show.bs.modal', (): void => {
            $('#' + ERR_MODAL_ID).off('shown.bs.modal');
            if($('body').hasClass('is-modal-open')) {
                $('#' + ERR_MODAL_ID).on('shown.bs.modal', (): void => {
                    $('body').removeClass('is-modal-open');
                    $('body').addClass('is-modal-open');
                });
            } else {
                $('body').addClass('is-modal-open');
            }
        });

        // エラーモーダル用イベント廃棄
        $scope.$on('$destroy', (): void => {
            $('#' + ERR_MODAL_ID).off('show.bs.modal');
            $('#' + ERR_MODAL_ID).off('shown.bs.modal');
        });

        // エラーモーダル用共通コントローラ
        $controller('errorInfoModalCtrl', {$scope: $scope});

        // カメラプラグイン関係エラーメッセージ（システムエラー）
        var ERR_TITLE: string = AppBizCom.Msg.getMsg('KKAP-CM000-06E', []);
        var ERR_CONTENTS: string = AppBizCom.Msg.getMsg('KKAP-CM000-07E', []);
        var ERR_LOG_MESSAGE_ID: string = 'KKAP-CM000-07E';

        // イベント：初期処理
        $scope.init = (): void =>  {
        }

        // 初期化処理
        var init = (): void => {
            // 「G1160-01:撮影書面表示画面」「G1160-02:撮影書面表示（スキップ時）画面」用コントローラ
            $controller('startCameraId', { $scope: $scope });

            // 遷移元により表示、遷移先変更
            var flags: any = AppBizCom.DataHolder.getFlowControlFlg();
            if (!flags.CAMERA_FLG_CONTROL) {
                flags.CAMERA_FLG_CONTROL = {};
            }
            $scope.editMode = flags.CAMERA_FLG_CONTROL.MOD_FLG;

            // パンくずの表示パターン
            $scope.pankuzuPatten = $scope.editMode ? '4' : '3';

            // 01-2022-02-303 個人番号カード利用時の文言表示追加対応 開始 20220415
            // 申込データ(事務手続き)取得
            var applyInfo: any = AppBizCom.DataHolder.getNotifInfo();
            // 01-2022-02-303 個人番号カード利用時の文言表示追加対応 終了 20220415

            // 前画面が「G1090-01:確認書類撮影開始画面」/「G1110-01:個人番号入力画面」の場合
            var path:string = AppBizCom.DataHolder.getPrevRoutePath();
            if (path === 'selectIdentificationDescription' || path === 'mynumberInput' ) {
                // 「戻る」ボタン非表示
                $scope.isShowBack = path === 'mynumberInput';

                // 01-2022-02-303 個人番号カード利用時の文言表示追加対応 開始 20220415
                // 申込データ(事務手続き)取得
                //var applyInfo: any = AppBizCom.DataHolder.getNotifInfo();
                // 01-2022-02-303 個人番号カード利用時の文言表示追加対応 終了 20220415
                // 確認書類チェック情報初期化
                applyInfo.KAKNIN_SY_CHK_JOHO = {
                    HONIN_KAKNIN_SY1_YMTR_K: undefined, // 本人確認書類（1種類目）読み取り可能確認区分
                    HONIN_KAKNIN_SY1_UTRK_K: undefined, // 本人確認書類（1種類目）写り込み確認区分
                    HONIN_KAKNIN_SY1_SINKYU_K: undefined, // 本人確認書類（1種類目）新旧情報記載確認区分
                    HONIN_KAKNIN_SY1_NRTB_K: undefined, // 本人確認書類（1種類目）自動塗りつぶし確認区分
                    HONIN_KAKNIN_SY2_YMTR_K: undefined, // 本人確認書類（2種類目）読み取り可能確認区分
                    HONIN_KAKNIN_SY2_UTRK_K: undefined, // 本人確認書類（2種類目）写り込み確認区分
                    HONIN_KAKNIN_SY2_SINKYU_K: undefined, // 本人確認書類（2種類目）新旧情報記載確認区分
                    JIDO_NRTBS_KJY: undefined,          // 自動塗りつぶし解除区分
                    HONIN_KAKNIN_SY1_MYNO_K: undefined, // 本人確認書類（1種類目）個人番号記載確認区分
                    HONIN_KAKNIN_SY2_MYNO_K: undefined, // 本人確認書類（2種類目）個人番号記載確認区分
                }
                // 申込データ(事務手続き)設定
                AppBizCom.DataHolder.setNotifInfo(applyInfo);

                // 画像データ取得
                var imageData: any = AppBizCom.DataHolder.getImageData();
                // 画像データ初期化
                if (!imageData) imageData = {};
                // 本人確認書類撮影関係の画像初期化
                imageData.HONIN_KAKNIN_SY1_GAZO1 = undefined; // 本人確認書類1種類目画像1
                imageData.HONIN_KAKNIN_SY1_GAZO2 = undefined; // 本人確認書類1種類目画像2
                imageData.HONIN_KAKNIN_SY1_GAZO3 = undefined; // 本人確認書類1種類目画像3
                imageData.HONIN_KAKNIN_SY2_GAZO1 = undefined; // 本人確認書類2種類目画像1
                imageData.HONIN_KAKNIN_SY2_GAZO2 = undefined; // 本人確認書類2種類目画像2
                imageData.HONIN_KAKNIN_SY2_GAZO3 = undefined; // 本人確認書類2種類目画像3
                imageData.AUTO_FILL_GAZO1 = undefined;        // 自動塗りつぶし画像1
                imageData.AUTO_FILL_GAZO2 = undefined;        // 自動塗りつぶし画像2
                // 画像データ設定
                AppBizCom.DataHolder.setImageData(imageData);
            } else {
                // 表示
                $scope.isShowBack = true;
            }

            // 01-2022-02-303 個人番号カード利用時の文言表示追加対応 開始 20220415
            // 番号確認書類データ取得
            var selectedNumInfo = applyInfo.MNSYSEIRY_JOHO ? applyInfo.MNSYSEIRY_JOHO.MNSYSEIRY_K : undefined;

            // 番号確認書類が個人番号カードの場合
            if (selectedNumInfo === '1') {
                $scope.isMynumCard = true;
            } else {
                $scope.isMynumCard = false;
            }
            // 01-2022-02-303 個人番号カード利用時の文言表示追加対応 終了 20220415
        }

        // イベント：「戻る」ボタンタップ時
        $scope.btnBackClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 前画面へ遷移する。遷移先は共通処理「APPBIZ-00010：業務共通領域」により取得する。
            var path:string = AppBizCom.DataHolder.getPrevRoutePath();
            logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);

            // 「G1110-01：個人番号入力画面」/「G1140-01:本人確認書類のご説明・ご選択画面」
            PRE_PAGE_ID = path === 'mynumberInput' ? 'G1110-01' : 'G1140-01';
            // アクションログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, PRE_PAGE_ID, '戻る');
        }

         // イベント：「次へ」ボタンタップ時
        $scope.nextBtnClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 撮影しない
            var NO_PICT: string = '2';

            // 申込データ(事務手続き)取得
            var info: any = AppBizCom.DataHolder.getNotifInfo();

            // 「G1160:撮影書面表示画面」設定（本人確認書類郵送区分（1種類目）確認）
            var idNum: number = info.HONIN_KAKNIN_SY_JOHO.HONIN_KAKNIN_SY_YUSO_K_1 === NO_PICT ? 2 : 1 ;
            $scope.initIdentityDocInfo(idNum, MAIN_PAGE_ID, DISPLAY_MODAL_ID);

            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, DISPLAY_MODAL_ID, '次へ');
            // モーダル表示
            $('#' + DISPLAY_MODAL_ID).modal('show');

            stopBtnEventFLG = false;
        }

        init();
    }
]);