// <reference path="../reference.d.ts" />
App.controller('selectIdentificationDocController', ['$scope', '$controller', 'AppBizCom', 'logicCom',
    function ($scope, $controller, AppBizCom, logicCom) {
        // 画面ID定義
        var MAIN_PAGE_ID: string = 'G1140-01';     // 本人確認書類のご説明・ご選択画面
        var PRE_PAGE_ID: string = 'G1110-01';      // 個人番号入力画面
        var NEXT_PAGE_ID: string = '';
        var CONFIRM_MODAL_ID: string = 'G1140-02'; // 撮影枚数確認画面
        var ERR_MODAL_ID: string = 'G1020-02';     // エラーモーダル画面

        // 画面PATH定義
        var NEXT_PAGE_PATH: string = '';

        // ボタン連打防止フラグ
        var stopBtnEventFLG: boolean = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };

        // 注意喚起メッセージフラグ名
        var headsUpName: string = '';
        // 定数：撮影する
        var TAKE_PICT: string = '1';
        // 定数：撮影しない
        var NO_PICT: string = '2';

        // スクロールロック
        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };
        // スクロールアンロック
        var scrollUnlock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
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

        // 詳細リンク用コントローラ
        $controller('detailModalController', {$scope: $scope});

        // 本人確認書類マスタデータ取得
        var idTypes: any = AppBizCom.MstData.getCodeMstDataByKbn('HONIN_KAKNIN_SY');

        // 初期化処理
        var init = (): void => {
            scrollUnlock();

            // 注意喚起メッセージ表示フラグ初期化
            $scope.isShowFirstType7 = false;
            $scope.isShowSecondType4 = false;
            $scope.isShowSecondType2 = false;
            $scope.isShowSecondType5 = false;

            // 選択書類情報の初期化
            $scope.idType1 = {CD: undefined, key: undefined, mail: undefined};
            $scope.idType2 = {CD: undefined, key: undefined, mail: undefined};

            // 本人確認書類マスタデータより選択項目用オブジェクトを作成
            // 顔写真あり
            $scope.define1 = {};
            var withFace: any = idTypes.filter(idTypes => idTypes.STM2 === '1');
            var prefixD1: string ='firstType';
            $.each(withFace, (index, value):void => {
                // ex) $scope.define1[firstType1] = { CD: '1', MSY: '個人番号カード', disabled: false, value: undefined };
                $scope.define1[prefixD1 + (index + 1)] = { CD: value.CD, MSY: value.MSY, disabled: false, value: undefined };
            });
            // 顔写真なし
            $scope.define2 = {};
            var prefixD2 ='secondType';
            var noFace = idTypes.filter(idTypes => idTypes.STM2 === '0');
            $.each(noFace, (index, value):void => {
                $scope.define2[prefixD2 + (index + 1)] = { CD: value.CD, MSY: value.MSY, disabled: false, value: undefined };
            });

            //ルーティング情報削除
            AppBizCom.DataHolder.deleteRouteInfoByPath('selectIdentificationDoc');
            
            // 遷移元により表示、遷移先変更
            var flags: any = AppBizCom.DataHolder.getFlowControlFlg();
            if (!flags.CAMERA_FLG_CONTROL) {
                flags.CAMERA_FLG_CONTROL = {};
            }
            $scope.editMode = flags.CAMERA_FLG_CONTROL.MOD_FLG;

            // パンくずの表示パターン
            $scope.pankuzuPatten = $scope.editMode ? '4' : '3';

            // 「次へ」ボタンラベル表記初期化
            $scope.btnNextLabel = '次へ';

            var applyInfo: any = AppBizCom.DataHolder.getNotifInfo();
            var selectedInfo: any = applyInfo.HONIN_KAKNIN_SY_JOHO;

            // 個人番号登録有無設定
            // 個人番号告知する場合
            if (applyInfo.JIMU_JOHO.MYNO_KOKUCHI === '1') {
                $scope.isSkipMyNumer = false;
            // 住所変更時
            } else if (flags.INPUT_FLG_CONTROL && flags.INPUT_FLG_CONTROL.KYAK_ADDR_F === '1') {
                // 確認書類を持参している場合
                if (applyInfo.JIMU_JOHO.MNSYSEIRY_JISN_FLAG === '1') {
                    $scope.isSkipMyNumer = false;
                // 確認書類未持参の場合
                } else {
                    $scope.isSkipMyNumer = true;
                }
            } else {
                $scope.isSkipMyNumer = true;
            }

            // ラベル設定
            $scope.withFaceLabel = $scope.isSkipMyNumer ? '顔写真あり' : '顔写真あり（1点）';
            $scope.noFaceLabel = $scope.isSkipMyNumer ? '顔写真なし' : '顔写真なし（2点）';

            // 注意喚起帯表示処理
            $scope.reNameFlg = flags.INPUT_FLG_CONTROL && flags.INPUT_FLG_CONTROL.KYAKNM_F === '1';
            if (flags.INPUT_FLG_CONTROL && flags.INPUT_FLG_CONTROL.KYAK_ADDR_F === '1') {
                $scope.addressChangeFlg = applyInfo.JIMU_JOHO.MNSYSEIRY_JISN_FLAG === '0'; 
            }

            // 共通領域の値を画面へ反映
            if (selectedInfo && selectedInfo.HONIN_KAKNIN_SY_K_1) {
                // 書類選択状況の整合性チェック
                var consistencyCheck: boolean = false;
                var isWithFace: boolean = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', selectedInfo.HONIN_KAKNIN_SY_K_1).STM2 === '1';
                if (isWithFace) {
                    consistencyCheck = true;
                // 前回遷移時、個人番号告知する 
                } else if (selectedInfo.HONIN_KAKNIN_SY_K_2) {
                    consistencyCheck = !$scope.isSkipMyNumer;
                // 前回遷移時、個人番号告知しない
                } else {
                    consistencyCheck = $scope.isSkipMyNumer;
                }

                if (consistencyCheck) {
                    $scope.idType1.CD = selectedInfo.HONIN_KAKNIN_SY_K_1;
                    $scope.idType1.mail = selectedInfo.HONIN_KAKNIN_SY_YUSO_K_1;
                    $scope.idType2.CD = selectedInfo.HONIN_KAKNIN_SY_K_2;
                    $scope.idType2.mail = selectedInfo.HONIN_KAKNIN_SY_YUSO_K_2;

                    // 全書類非活性
                    for (var key in $scope.define1) {
                        $scope.define1[key].disabled = true;
                    }
                    for (var key in $scope.define2) {
                        $scope.define2[key].disabled = true;
                    }

                    // 選択書類にチェック、活性
                    // 顔写真なし
                    if (!isWithFace) {
                        for ( var key in $scope.define2) {
                            if ($scope.define2[key].CD === $scope.idType1.CD) {
                                $scope.define2[key].value = 1;
                                $scope.define2[key].disabled = false;
                                $scope.idType1.key = key;
                                if ($scope.define2[key].CD === '12' ||
                                    $scope.define2[key].CD === '14' ||
                                    $scope.define2[key].CD === '15') {
                                    $scope['isShowSecondType' + (parseInt($scope.define2[key].CD) - 10 )] = $scope.idType1.mail === NO_PICT ? true : false;
                                }
                            } else if ($scope.define2[key].CD === $scope.idType2.CD) {
                                $scope.define2[key].value = 1;
                                $scope.define2[key].disabled = false;
                                $scope.idType2.key = key;
                                if ($scope.define2[key].CD === '12' ||
                                    $scope.define2[key].CD === '14' ||
                                    $scope.define2[key].CD === '15') {
                                    $scope['isShowSecondType' + (parseInt($scope.define2[key].CD) - 10 )] = $scope.idType2.mail === NO_PICT ? true : false;
                                }
                            }
                        }
                    // 顔写真あり
                    } else {
                        for ( var key in $scope.define1) {
                            if ($scope.define1[key].CD === $scope.idType1.CD) {
                                $scope.define1[key].value = 1;
                                $scope.define1[key].disabled = false;
                                $scope.idType1.key = key;
                                if ($scope.define1[key].CD === '07') {
                                    $scope['isShowFirstType' + parseInt($scope.define1[key].CD)] = $scope.idType1.mail === NO_PICT ? true : false;
                                }
                            }
                        }
                    }
                }
                if ($scope.idType2.CD) {
                    if ($scope.idType2.mail == NO_PICT && $scope.idType1.mail == NO_PICT && $scope.editMode == true) {
                        $scope.btnNextLabel = '確認画面へ';
                    }
                }
                else {
                    if ($scope.idType1.mail == NO_PICT && $scope.editMode == true) {
                        $scope.btnNextLabel = '確認画面へ';
                    }
                }
            }
        }

        // 選択情報初期化処理
        var clearIdType = target => {
            if (target === 1) {
                $scope.idType1.CD = undefined;
                $scope.idType1.key = undefined;
                $scope.idType1.mail = undefined;
            } else if (target === 2) {
                $scope.idType2.CD = undefined;
                $scope.idType2.key = undefined;
                $scope.idType2.mail = undefined;
            }
        }

        // 共通領域保存処理
        var setNotifInfo = (idType1: any, idType2: any): void => {
            // 申込データ(事務手続き)取得
            var applyInfo: any = AppBizCom.DataHolder.getNotifInfo();

            // 本人確認選択情報設定
            applyInfo.HONIN_KAKNIN_SY_JOHO = {
                HONIN_KAKNIN_SY_K_1: idType1.CD,
                HONIN_KAKNIN_SY_YUSO_K_1: idType1.mail,
                HONIN_KAKNIN_SY_K_2: idType2.CD,
                HONIN_KAKNIN_SY_YUSO_K_2: idType2.mail
            }

            // 申込データ(事務手続き)設定
            AppBizCom.DataHolder.setNotifInfo(applyInfo);
        }

        // -----「G1140-01:本人確認書類のご説明・ご選択画面」イベント-----

        // イベント：初期処理
        $scope.init = (): void => {
            // 注意喚起メッセージ取得
            var HEADSUP_MSG = AppBizCom.Msg.getMsg('KKAP-SF010-01I', []);
            $('.alarmArea_text').each((index, elm) => {
                $(elm).html(HEADSUP_MSG);
            });
        }

        // イベント：本人確認書類タップ時（１）
        // 　選択、選択解除処理
        $scope.selectInfo = id => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            var tmp1: any = $scope.define1[id];
            var tmp2: any = $scope.define2[id];

            // ----- 顔写真あり -----
            if (tmp1) {
                // 書類選択時
                if (tmp1.value) {
                    // 選択書類以外を非活性状態にする
                    // 顔写真あり
                    for (var key in $scope.define1) {
                        $scope.define1[key].disabled = (key == id) ? false : true;
                    }
                    // 顔写真なし　同時に選択解除
                    for (var key in $scope.define2) {
                        $scope.define2[key].value = undefined;
                        $scope.define2[key].disabled = true;
                    }

                    // 郵送時の注意喚起メッセージ非表示(顔写真なし)
                    $scope.isShowSecondType2 = false; // 住民票の写し
                    $scope.isShowSecondType4 = false; // その他１（顔写真あり）
                    $scope.isShowSecondType5 = false; // その他２（顔写真あり）

                    // 選択情報更新
                    $scope.idType1.CD = tmp1.CD;
                    $scope.idType1.key = id;
                    $scope.idType1.mail = TAKE_PICT;
                    clearIdType(2);

                // 書類選択解除時
                } else {
                    // 全書類を活性状態にする
                    // 顔写真あり
                    for (var key in $scope.define1) {
                        $scope.define1[key].disabled = false;
                    }
                    // 顔写真なし
                    for (var key in $scope.define2) {
                        $scope.define2[key].disabled = false;
                    }
                    // 選択情報更新
                    clearIdType(1);
                }
            // ----- 顔写真なし -----
            // 個人番号を告知する場合
            } else if ($scope.isSkipMyNumer && tmp2) {
                // 書類選択時
                if (tmp2.value) {
                    // 選択書類以外を非活性状態にする
                    // 顔写真あり
                    for (var key in $scope.define1) {
                        $scope.define1[key].disabled = true;
                    }
                    // 顔写真なし　同時に選択解除
                    for (var key in $scope.define2) {
                        $scope.define2[key].disabled = (key === id) ? false : true;
                    }

                    // 選択情報更新
                    $scope.idType1.CD = tmp2.CD;
                    $scope.idType1.key = id;
                    $scope.idType1.mail = TAKE_PICT;
                    clearIdType(2);

                // 書類選択解除時
                } else {
                    // 全書類を活性状態にする
                    // 顔写真あり
                    for (var key in $scope.define1) {
                        $scope.define1[key].disabled = false;
                    }
                    // 顔写真なし
                    for (var key in $scope.define2) {
                        $scope.define2[key].disabled = false;
                    }
                    // 選択情報更新
                    clearIdType(1);
                }
            } else if (tmp2) {
                // 書類1種類目選択時
                if (!$scope.idType1.CD){
                    // 選択情報更新
                    $scope.idType1.CD = tmp2.CD;
                    $scope.idType1.key = id;
                    $scope.idType1.mail = TAKE_PICT;

                // 書類2種類目未選択の場合
                } else if (!$scope.idType2.CD) {
                    // 書類2種類目選択時 
                    if (tmp2.value) {
                        // 選択書類以外を非活性状態にする
                        for (var key in $scope.define1) {
                            $scope.define1[key].disabled = true;
                        }
                        for (var key in $scope.define2) {
                            $scope.define2[key].disabled = (key === id || key === $scope.idType1.key) ? false : true;
                        }
                        // 選択情報更新
                        $scope.idType2.CD = tmp2.CD;
                        $scope.idType2.key = id;
                        $scope.idType2.mail = TAKE_PICT;

                    // 書類1種類目選択解除時
                    } else {
                        // 全書類を活性状態にする
                        // 顔写真あり
                        for (var key in $scope.define1) {
                            $scope.define1[key].disabled = false;
                        }
                        // 顔写真なし
                        for (var key in $scope.define2) {
                            $scope.define2[key].disabled = false;
                        }
                        // 選択情報更新
                        clearIdType(1);
                    }
                // 書類選択解除時
                } else {
                    // 全書類を活性状態にする
                    // 顔写真あり
                    for (var key in $scope.define1) {
                        $scope.define1[key].disabled = false;
                    }
                    // 顔写真なし
                    for (var key in $scope.define2) {
                        $scope.define2[key].disabled = false;
                    }
                    // 書類1種類目選択解除時
                    if (id === $scope.idType1.key) {
                        // 選択情報更新
                        $scope.idType1.CD = $scope.idType2.CD;
                        $scope.idType1.key = $scope.idType2.key;
                        $scope.idType1.mail = $scope.idType2.mail;
                        clearIdType(2);
                    // 書類2種類目選択解除時
                    } else {
                        // 選択情報更新
                        clearIdType(2);
                    }
                }
            }
            stopBtnEventFLG = false;
        };

        // イベント：本人確認書類タップ時（２）　※一部書類のみ
        // 　注意喚起メッセージ非表示、「G1140-02:撮影枚数確認画面」表示処理
        $scope.fourPhotosClick = id => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 注意喚起メッセージフラグ名取得
            switch (id) {
                case 'firstType7' :
                    headsUpName = 'isShowFirstType7';  // その他（顔写真あり）
                break;

                case 'secondType2' :
                    headsUpName = 'isShowSecondType2'; // 住民票の写し
                break;

                case 'secondType4' :
                    headsUpName = 'isShowSecondType4'; // その他１（顔写真あり）
                break;

                case 'secondType5' :
                    headsUpName = 'isShowSecondType5'; // その他２（顔写真あり）
                break;
            }

            // ----- 顔写真あり -----
            if ($scope.define1[id]) {
                // 選択時
                if ($scope.define1[id].value == 1) {
                    // 「G1140-02:撮影枚数確認画面」表示
                    scrollLock();
                    $scope.modalTypeName = $scope.define1[id].MSY;
                    $('#' + CONFIRM_MODAL_ID).modal('show');
                    // ログ出力
                    logicCom.btnTapLog(MAIN_PAGE_ID, CONFIRM_MODAL_ID, '本人確認書類(' + $scope.define1[id].MSY + ')');
                // 選択解除時
                } else {
                    // 注意喚起メッセージ非表示
                    $scope[headsUpName] = false;
                    // 「次へ」ボタンラベル表記変更
                    if ($scope.btnNextLabel === '確認画面へ') $scope.btnNextLabel = '次へ';
                }
            // ----- 顔写真なし -----
            } else if ($scope.define2[id]){
                // 選択時
                if ($scope.define2[id].value == 1) {
                    // 「G1140-02:撮影枚数確認画面」表示
                    scrollLock();
                    $scope.modalTypeName = $scope.define2[id].MSY;
                    $('#' + CONFIRM_MODAL_ID).modal('show');
                    // ログ出力
                    logicCom.btnTapLog(MAIN_PAGE_ID, CONFIRM_MODAL_ID, '本人確認書類(' + $scope.define2[id].MSY + ')');
                // 選択解除時
                } else {
                    // 注意喚起メッセージ非表示
                    $scope[headsUpName] = false;
                    // 「次へ」ボタンラベル表記変更
                    if ($scope.btnNextLabel === '確認画面へ') $scope.btnNextLabel = '次へ';
                }
            }
            stopBtnEventFLG = false;
        }

        // イベント：「戻る」ボタンタップ時
        $scope.btnBackClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

             // 1) 前画面へ遷移する。遷移先は共通処理「APPBIZ-00010：業務共通領域」により取得する。
            var path:string = AppBizCom.DataHolder.getPrevRoutePath();
            logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);
            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, PRE_PAGE_ID, '戻る');
        }

        // イベント：「次へ」ボタンタップ時
        $scope.btnNextClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 確認書類チェック情報初期化
            var applyInfo: any = AppBizCom.DataHolder.getNotifInfo();
            applyInfo.KAKNIN_SY_CHK_JOHO = {
                HONIN_KAKNIN_SY1_YMTR_K: undefined,   // 本人確認書類（1種類目）読み取り可能確認区分
                HONIN_KAKNIN_SY1_UTRK_K: undefined,   // 本人確認書類（1種類目）写り込み確認区分
                HONIN_KAKNIN_SY1_SINKYU_K: undefined, // 本人確認書類（1種類目）新旧情報記載確認区分
                HONIN_KAKNIN_SY1_NRTB_K: undefined,   // 本人確認書類（1種類目）自動塗りつぶし確認区分
                HONIN_KAKNIN_SY2_YMTR_K: undefined,   // 本人確認書類（2種類目）読み取り可能確認区分
                HONIN_KAKNIN_SY2_UTRK_K: undefined,   // 本人確認書類（2種類目）写り込み確認区分
                HONIN_KAKNIN_SY2_SINKYU_K: undefined, // 本人確認書類（2種類目）新旧情報記載確認区分
                JIDO_NRTBS_KJY: undefined,            // 自動塗りつぶし解除区分
                HONIN_KAKNIN_SY1_MYNO_K: undefined,   // 本人確認書類（1種類目）個人番号記載確認区分
                HONIN_KAKNIN_SY2_MYNO_K: undefined    // 本人確認書類（2種類目）個人番号記載確認区分
            }
            AppBizCom.DataHolder.setNotifInfo(applyInfo);

            // 本人確認書類撮影関係画像データ初期化
            var imageData: any = AppBizCom.DataHolder.getImageData();
            if (!imageData) imageData = {};
            imageData.HONIN_KAKNIN_SY1_GAZO1 = undefined; // 本人確認書類1種類目画像1
            imageData.HONIN_KAKNIN_SY1_GAZO2 = undefined; // 本人確認書類1種類目画像2
            imageData.HONIN_KAKNIN_SY1_GAZO3 = undefined; // 本人確認書類1種類目画像3
            imageData.HONIN_KAKNIN_SY2_GAZO1 = undefined; // 本人確認書類2種類目画像1
            imageData.HONIN_KAKNIN_SY2_GAZO2 = undefined; // 本人確認書類2種類目画像2
            imageData.HONIN_KAKNIN_SY2_GAZO3 = undefined; // 本人確認書類2種類目画像3
            imageData.AUTO_FILL_GAZO1 = undefined;        // 自動塗りつぶし画像1
            imageData.AUTO_FILL_GAZO2 = undefined;        // 自動塗りつぶし画像2
            AppBizCom.DataHolder.setImageData();

// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
            // 「OCR結果データ」初期化
            var ocrData: any = AppBizCom.DataHolder.getOcrData();
            ocrData = {
                MODE: undefined,       // 撮影モード
                CARD_TYPE: undefined   // カードタイプ
            }
            AppBizCom.DataHolder.setOcrData(ocrData);
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

            // ----- 顔写真なし(個人番号を告知する場合) -----
            if ($scope.idType2.CD) {
                // コード順に並び替える
                if ($scope.idType1.CD > $scope.idType2.CD) {
                    [$scope.idType1, $scope.idType2] = [$scope.idType2, $scope.idType1];
                }

                // 撮影しない場合
                if ($scope.idType1.mail !== TAKE_PICT && $scope.idType2.mail !== TAKE_PICT) {
                    // ログ出力用遷移先画面ID
                    NEXT_PAGE_ID = $scope.editMode ? 'G1240-01' : 'G1220-01';
                    // 「G1240-01：お客様確認画面」/「G1220-01:お客様確と営業員による入力開始画面」へ遷移
                    NEXT_PAGE_PATH = $scope.editMode ? 'applicationConfirm' : 'applicationConfirmStart';
                // 撮影する場合
                } else {
                    // ログ出力用遷移先画面ID
                    NEXT_PAGE_ID = 'G1150-01';
                    // 「G1150-01:撮影開始説明画面」へ遷移
                    NEXT_PAGE_PATH = 'cameraDescription';
                }
            // ----- 顔写真あり/顔写真なし(個人番号を告知しない場合) -----
            } else {
                // 撮影しない場合
                if ($scope.idType1.mail === NO_PICT) {
                    // ログ出力用遷移先画面ID
                    NEXT_PAGE_ID = $scope.editMode ? 'G1240-01' : 'G1220-01';
                    // 「G1240-01：お客様確認画面」/「G1220-01:お客様確と営業員による入力開始画面」へ遷移
                    NEXT_PAGE_PATH = $scope.editMode ? 'applicationConfirm' : 'applicationConfirmStart';
                // 撮影する場合
                } else {
                    // ログ出力用遷移先画面ID
                    NEXT_PAGE_ID = 'G1150-01';
                    // 「G1150-01:撮影開始説明画面」へ遷移
                    NEXT_PAGE_PATH = 'cameraDescription';
                }
            }

            //共通領域へ保存
            setNotifInfo($scope.idType1, $scope.idType2);
            // ログ出力用オブジェクト
            var result = {
                'HONIN_KAKNIN_SY_K_1': {'value': $scope.idType1.CD},
                'HONIN_KAKNIN_SY_YUSO_K_1': {'value': $scope.idType1.mail},
                'HONIN_KAKNIN_SY_K_2': {'value': $scope.idType2.CD},
                'HONIN_KAKNIN_SY_YUSO_K_2': {'value': $scope.idType2.mail},
            };

            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, NEXT_PAGE_ID, $scope.btnNextLabel, result);
            // 次画面へ遷移する。
            logicCom.locationPath(NEXT_PAGE_PATH, callbackFLG, callbackFLG, connectionErrorCallback);
        }

        // -----「G1140-02:撮影枚数確認画面」イベント-----

        // イベント：初期処理
        $scope.initModal = (): void => {
            // イベント登録
            $('#' + CONFIRM_MODAL_ID).on('show.bs.modal', (): void => {
                $('body').addClass('is-modal-open');
            });
            $('#' + CONFIRM_MODAL_ID).on('hidden.bs.modal', (): void => {
                $('body').removeClass('is-modal-open');
            });

            // イベント廃棄
            $scope.$on('$destroy', (): void => {
                $('#' + CONFIRM_MODAL_ID).off('show.bs.modal');
                $('#' + CONFIRM_MODAL_ID).off('hidden.bs.modal');
            });
        }

        // イベント：「いいえ」ボタンタップ時
        $scope.btnNoClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }
            scrollUnlock();
            // 郵送区分更新（4枚以上のため別途郵送）
            if ($scope.idType2.CD) {
                $scope.idType2.mail = NO_PICT;
                if ($scope.idType1.mail == NO_PICT && $scope.editMode == true) {
                    $scope.btnNextLabel = '確認画面へ';
                }
            } else {
                $scope.idType1.mail = NO_PICT;
                if ($scope.idType1.key.match('firstType') && $scope.editMode == true) {
                    $scope.btnNextLabel = '確認画面へ';
                } else if ($scope.isSkipMyNumer && $scope.idType1.key.match('secondType') && $scope.editMode == true) {
                    $scope.btnNextLabel = '確認画面へ';
                }
            }

            // 注意喚起メッセージ表示
            $scope[headsUpName] = true;
            headsUpName = '';
            // ログ出力
            logicCom.btnTapLog(CONFIRM_MODAL_ID, MAIN_PAGE_ID, 'いいえ');
            // 「G1140-02:撮影枚数確認画面」閉じる
            $('#' + CONFIRM_MODAL_ID).modal('hide');

            stopBtnEventFLG = false;
        }

        // イベント：「はい」ボタンタップ時
        $scope.btnYesClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }
            scrollUnlock();
            headsUpName = '';
            // ログ出力
            logicCom.btnTapLog(CONFIRM_MODAL_ID, MAIN_PAGE_ID, 'はい');
            // 「G1140-02:撮影枚数確認画面」閉じる
            $('#' + CONFIRM_MODAL_ID).modal('hide');

            stopBtnEventFLG = false;
        }

        // 初期化
        init();
    }]);
