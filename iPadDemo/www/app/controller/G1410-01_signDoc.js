/// <reference path="../reference.d.ts" />
App.controller('signDocController', ['$scope', '$timeout', '$controller', 'AppBizCom', 'logicCom', 'AppComDevice', 'AppComDate',
    function ($scope, $timeout, $controller, AppBizCom, logicCom, AppComDevice, AppComDate) {
        // 共通部分制御を継承
        $controller('errorInfoModalCtrl', { $scope: $scope });
        /** 画面ID. */
        var BEHIND_PAGE_ID = 'G1400-01';
        var PAGE_ID = 'G1410-01';
        var PAGE_ID_SIGN = 'G1410-02';
        var PAGE_ID_COMP = 'G1410-03';
        var PAGE_ID_SENT = 'G1270-01';
        var BASE64_HEAD = 'data:image/jpeg;base64,';
        /** ボタン. */
        var SHOME_BTN_NAME = '署名する';
        var ALLDEL_BTN_NAME = 'すべて削除';
        var RETURN_BTN_NAME = '戻る';
        var FIX_BTN_NAME = '確定';
        var YES_BTN_NAME = 'はい';
        var NO_BTN_NAME = 'いいえ';
        /** NA（位置情報が存在しない場合に使用）. */
        var NA = 'NA';
        // 署名画像
        var canvas;
        // 帳票画像
        var canvas_main;
        /** ボタン連打防止フラグ. */
        var isStopBtn = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            isStopBtn = false;
        };
        // 画像データ
        var imageData = {};
        // 申込データ
        var eFormInfo = {};
        var clearCanvas = function () {
            canvas_main.width = canvas_main.height = 0;
        };
        // モーダル画面が表示される時、呼び出し元画面をスクロールできないように制御
        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
            $('.scrollArea').css({ 'overflow': 'hidden' });
        };
        // モーダル画面が閉じられる時、呼び出し元画面をスクロールできるように制御
        var scrollUnlock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
            $('.scrollArea').css({ 'overflow': 'scroll' });
        };
        /**
          * 初期化処理
          */
        $scope.init = function () {
            // 画像データ
            imageData = AppBizCom.DataHolder.getImageData();
            // 申込データ
            eFormInfo = AppBizCom.DataHolder.getEFormInfo();
            // 電子帳票ID
            $scope.docCode = eFormInfo.CHOHYO.CHOHYO_ID;
            // 電子帳票対象書面を表示
            var img = new Image();
            img.onload = function () {
                canvas_main = document.getElementById("canvas_main");
                var ctx = canvas_main.getContext('2d');
                canvas_main.width = img.width;
                canvas_main.height = img.height;
                // 署名画像
                $scope.isSign = false;
                // データを canvas に表示
                ctx.drawImage(img, 0, 0);
                // テキスト日付情報出力
                drawText(ctx);
                // チェックボックスの描画
                $scope.showCheckBox = isShowCheckBox();
                $scope.$apply();
            };
            img.src = BASE64_HEAD + imageData.DOC_BASE_GAZO;
        };
        // オボジェクトの判断
        var getObject = function (obj) {
            return angular.isObject(obj) ? angular.copy(obj) : {};
        };
        /**
         * 署名ボタンの表示状態を判定する
         */
        $scope.isActiveSyomei = function () {
            var result = false;
            switch ($scope.docCode) {
                case "870":
                    if ($scope.consentCheck != undefined) {
                        result = true;
                    }
                    break;
                case "871":
                    result = true;
                    break;
                default:
                    result = true;
                    break;
            }
            return result;
        };
        //チェックボックスフラグ
        var isShowCheckBox = function () {
            var result = false;
            switch ($scope.docCode) {
                case "870":
                    result = true;
                    break;
                case "871":
                    break;
                default:
                    break;
            }
            return result;
        };
        /**
         *  テキスト情報を取得
         */
        var drawText = function (ctx) {
            // 店部課コード
            var miseCode = eFormInfo.KYAK_JOHO.MISE_C.substr(1, 3);
            // 客コード
            var kyakCode = eFormInfo.KYAK_JOHO.KYAK_CIF_C;
            // メールアドレスアカウント名
            var mailCode = eFormInfo.CHOHYO.MAIL_ACCOUNT;
            // 帳票IDを取得する
            var choHyoId = eFormInfo.CHOHYO.CHOHYO_ID;
            // ドメイン名入力フラグを取得する
            var mailFlag = eFormInfo.CHOHYO.MAIL_DOMAIN_FLAG;
            // メールアドレスドメインコード
            var codeCd = eFormInfo.CHOHYO.MAIL_DOMAIN_C;
            // ドメイン名を取得
            if (choHyoId != null) {
                // ドメイン名入力フラグ= 0の場合コードマスタ情報取得と電子帳票情報取得する
                if (mailFlag === '0') {
                    // ドメイン名入力フラグ= 1の場合メールアドレスドメインプルダウン取得する
                    $scope.domainValue = AppBizCom.MstData.getCodeMstDataByCd('E_MAIL_DOMAIN', codeCd).MSY;
                }
                else {
                    // メールアドレスドメイン名を取得する
                    $scope.domainValue = eFormInfo.CHOHYO.MAIL_DOMAIN;
                }
            }
            // 端末から属性日時を設定する。
            var today = AppComDate.getCurrentDate().split('-');
            var yearStr = today[0].toString().substr(2, 2);
            var monthStr = today[1].toString();
            var dayStr = today[2].toString();
            switch ($scope.docCode) {
                case "870":
                    // 口座番号の出力
                    ctx.font = "48px 'HiraKakuProN-W6'";
                    // 店部課コードの入力
                    for (var i = 0; i < 3; i++) {
                        var miseStr = miseCode.substring(i, i + 1);
                        ctx.fillText(miseStr, 756 + (i + 1) * 64, 520);
                    }
                    // 客コードの入力
                    for (var j = 0; j < 7; j++) {
                        var kyakStr = kyakCode.substring(j, j + 1);
                        ctx.fillText(kyakStr, 1078 + j * 64, 520);
                    }
                    // お申し込み日の出力
                    ctx.font = "32px 'HiraKakuProN-W6'";
                    ctx.fillText(yearStr, 557, 635);
                    ctx.fillText(monthStr, 726, 635);
                    ctx.fillText(dayStr, 848, 635);
                    // 指定メールアドレスの出力
                    var mailStr = mailCode + '@' + $scope.domainValue;
                    var returnLength = 29;
                    if (mailStr.length > returnLength) {
                        var firstStr = mailStr.substr(0, returnLength);
                        ctx.fillText(firstStr, 504, 955);
                        var secondStr = mailStr.substr(returnLength, mailStr.length - returnLength);
                        ctx.fillText(secondStr, 504, 990);
                    }
                    else {
                        ctx.fillText(mailStr, 504, 980);
                    }
                    break;
                case "871":
                    ctx.font = "48px 'HiraKakuProN-W6'";
                    // 店部課コードの入力
                    for (var i = 0; i < 3; i++) {
                        var miseStr = miseCode.substring(i, i + 1);
                        ctx.fillText(miseStr, 425 + (i + 1) * 69, 693);
                    }
                    // 客コードの入力
                    for (var j = 0; j < 7; j++) {
                        var kyakStr = kyakCode.substring(j, j + 1);
                        ctx.fillText(kyakStr, 774 + j * 69, 693);
                    }
                    // お申し込み日の出力
                    ctx.font = "32px 'HiraKakuProN-W6'";
                    // 年
                    ctx.fillText(yearStr, 850, 783);
                    // 月
                    ctx.fillText(monthStr, 988, 783);
                    // 日
                    ctx.fillText(dayStr, 1108, 783);
                    break;
                default:
                    break;
            }
        };
        // 自動的に画面全体のドラッグや選択を不可能にする機能はオフ
        InkTool.InkCanvasLib.setPreventDragAndSelect(false);
        //  等幅ペン
        var pen1 = new InkTool.SolidPen();
        // ペンの太さを設定
        pen1.setPenWidth(1);
        // ペン色を設定                      
        pen1.setPenColor(new InkTool.InkColor('#000'));
        // 「.modal-open」をクリック
        $('[data-target]').click(function () {
            if (isStopBtn) {
                return;
            }
            $timeout(function () {
                if (canvas) {
                    canvas.clearInk();
                }
                $scope.isShowSubmit = false;
            });
            if ($(this).attr('data-target') === '#G1410-02') {
                // 背景固定
                scrollLock();
                if (!document.getElementById('signModal-overlay')) {
                    // オーバーレイ用の要素を追加
                    $('body').append("<div id='signModal-overlay' class='modal-overlay'></div>");
                    // オーバーレイをフェードイン
                    $('.modal-overlay').fadeIn('fast');
                }
                // モーダルコンテンツのIDを取得
                var modal1 = $(this).attr('data-target');
                // モーダルコンテンツフェードイン
                $(modal1).fadeIn('fast');
            }
        });
        /**
        *  署名ボタンタップ時
        */
        $scope.inputSignBtnClick = function () {
            // ボタン連打防止確認
            if (isStopBtn)
                return;
            // ボタン連打防止開始
            isStopBtn = true;
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID, PAGE_ID_SIGN, SHOME_BTN_NAME);
            // 署名用のinktoolを id='canvas'のタグにバインドして生成する
            if (!canvas) {
                canvas = InkTool.InkCanvasLib.createCanvas('canvas', 'auto+sp');
                canvas.setHandler('penup', handlePenUp);
                canvas.setPen(pen1);
            }
            // ボタン連打防止解除
            isStopBtn = false;
        };
        // ペンアップ時に呼び出されるハンドラ
        var handlePenUp = function (canvas, pos) {
            $scope.isShowSubmit = true;
            $scope.$apply();
        };
        /**
         *  削除イベント
         */
        $scope.canvasclear = function () {
            // 署名モーダル表示完了していない場合は何もしない
            if (!canvas)
                return;
            // ボタン連打防止確認
            if (isStopBtn)
                return;
            // ボタン連打防止開始
            isStopBtn = true;
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_SIGN, PAGE_ID_SIGN, ALLDEL_BTN_NAME);
            // 署名カンバスをクリア
            $timeout(function () {
                canvas.clearInk();
                $scope.isShowSubmit = false;
            });
            // ボタン連打防止解除
            isStopBtn = false;
        };
        /**
        *  「署名」の「戻る」ボタンタップ時
        */
        $scope.modalBackBtnClick = function () {
            // 署名モーダル表示完了していない場合は何もしない
            if (!canvas)
                return;
            // ボタン連打防止確認
            if (isStopBtn)
                return;
            // ボタン連打防止開始
            isStopBtn = true;
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID, PAGE_ID_SIGN, RETURN_BTN_NAME);
            // 署名カンバスをクリア
            canvas.clearInk();
            // 署名モーダル解除
            modalRelease();
            // ボタン連打防止解除
            isStopBtn = false;
        };
        /**
         *  「署名」の「確定」ボタンタップ時
         */
        $scope.modalConfirmBtnClick = function () {
            // ボタン連打防止確認
            if (isStopBtn)
                return;
            if (!$scope.isShowSubmit)
                return;
            // ボタン連打防止開始
            isStopBtn = true;
            $scope.isSign = true;
            $scope.showCheckBox = false;
            // アクションログ出力 
            logicCom.btnTapLog(PAGE_ID_SIGN, PAGE_ID, FIX_BTN_NAME);
            // 署名イメージを取得
            var canvas = InkTool.InkCanvasLib.getCanvas('canvas');
            // 緯度宣言
            var idoStr = '';
            // 経度宣言
            var keidoStr = '';
            // 画像メッセージ
            var signImg = new Image();
            signImg.onload = function () {
                var ctx = canvas_main.getContext('2d');
                // 社員ID
                var eigyoinStr = eFormInfo.EIGYOIN_JOHO.PROPER_C;
                // 申込データに事前に最新の位置情報を仮設定
                var locationData = getObject(AppBizCom.DataHolder.getLocation());
                var offerMailData = AppBizCom.DataHolder.getEFormInfo();
                offerMailData.MOSKM_HSK = offerMailData.MOSKM_HSK || {};
                offerMailData.MOSKM_HSK.IDO = locationData.IDO;
                offerMailData.MOSKM_HSK.KEIDO = locationData.KEIDO;
                AppBizCom.DataHolder.setEFormInfo(offerMailData);
                // 端末から緯度と経度を設定する。
                AppComDevice.getDeolocation(function (result) {
                    // 緯度
                    idoStr = result.coords.latitude;
                    // 経度
                    keidoStr = result.coords.longitude;
                    // 緯度と経度データ保存
                    setIdoAndKeido(idoStr, keidoStr);
                    // 帳票イメージ上に設定する
                    setImgMesssage(ctx, signImg, eigyoinStr, idoStr, keidoStr);
                    // 業務共通領域に画像データを保存する
                    setImageData();
                    // 署名カンバスをクリア
                    canvas.clearInk();
                    // 背景固定解除
                    $(window).off('.noScroll');
                    scrollUnlock();
                    // オーバーレイを削除
                    $('.modal-overlay').remove();
                    $("#G1410-02").fadeOut('fast');
                    // ボタン連打防止解除
                    isStopBtn = false;
                }, function (e) {
                    var locationData = getObject(AppBizCom.DataHolder.getLocation());
                    // 緯度
                    idoStr = locationData.IDO || NA;
                    // 経度
                    keidoStr = locationData.KEIDO || NA;
                    // 失敗メーセッジログ
                    logicCom.warnLog('「APPCOM-0002：端末情報共通のGPS情報を取得」処理失敗', e);
                    // 帳票イメージ上に設定する
                    setImgMesssage(ctx, signImg, eigyoinStr, idoStr, keidoStr);
                    // 業務共通領域に画像データを保存する
                    setImageData();
                    // 署名カンバスをクリア
                    canvas.clearInk();
                    // 背景固定解除
                    $(window).off('.noScroll');
                    scrollUnlock();
                    // オーバーレイを削除
                    $('.modal-overlay').remove();
                    $("#G1410-02").fadeOut('fast');
                    // ボタン連打防止解除
                    isStopBtn = false;
                });
            };
            signImg.src = canvas.saveImageDPI(200, 'image/png');
            // 業務共通領域に画像データを保存する
            var setImageData = function () {
                // ストローク情報
                imageData.SYM_STRK = canvas.saveInk();
                var canvas_main = document.getElementById("canvas_main");
                var ctx = canvas_main.getContext('2d');
                // 書面データの取得
                var url = canvas_main.toDataURL("image/jpeg", 1.00);
                url = url.replace(/^.*,/, '');
                // 電子署名画像
                imageData.DOC_GAZO = url;
            };
        };
        /**
         * 位置情報を業務共通領域に設定する
         *
         * @param {string} idoStr - 緯度
         * @param {string} keidoStr - 経度
         * @return void
         */
        var setIdoAndKeido = function (idoStr, keidoStr) {
            // 共通領域の位置情報に設定
            var positionJoho = {
                IDO: idoStr,
                KEIDO: keidoStr
            };
            // 共通領域の位置情報保存
            AppBizCom.DataHolder.setLocation(positionJoho);
            // 申込データに設定
            var offerMailData = AppBizCom.DataHolder.getEFormInfo();
            offerMailData.MOSKM_HSK = offerMailData.MOSKM_HSK || {};
            offerMailData.MOSKM_HSK.IDO = idoStr;
            offerMailData.MOSKM_HSK.KEIDO = keidoStr;
            AppBizCom.DataHolder.setEFormInfo(offerMailData);
        };
        /**
         * @param {any} ctx - 描画
         * @param {any} signImg - 画像メーセッジ
         * @param {string} eigyoinStr - 社員ID
         * @param {string} idoStr - 緯度
         * @param {string} keidoStr - 経度
         * @return void
         * 画像メーセッジ
         */
        var setImgMesssage = function (ctx, signImg, eigyoinStr, idoStr, keidoStr) {
            switch ($scope.docCode) {
                case "870":
                    // 署名の出力
                    var tempCanvas1 = document.createElement('canvas');
                    tempCanvas1.height = signImg.height * 0.65;
                    tempCanvas1.width = signImg.width * 0.65;
                    var tempCtx1 = tempCanvas1.getContext('2d');
                    tempCtx1.drawImage(signImg, 0, 0, signImg.width * 0.65, signImg.height * 0.65);
                    var tempCanvas2 = document.createElement('canvas');
                    tempCanvas2.height = tempCanvas1.height * 0.65;
                    tempCanvas2.width = tempCanvas1.width * 0.65;
                    var tempCtx2 = tempCanvas2.getContext('2d');
                    tempCtx2.drawImage(signImg, 0, 0, tempCanvas1.width * 0.65, tempCanvas1.height * 0.65);
                    ctx.drawImage(tempCanvas2, 503, 766, tempCanvas2.width * 0.60, tempCanvas2.height * 0.60);
                    tempCanvas1.height = 0;
                    tempCanvas1.width = 0;
                    tempCanvas2.height = 0;
                    tempCanvas2.width = 0;
                    // チェックボックスを描画する
                    if ($scope.consentCheck === "1") {
                        drawCheckBox(ctx, 508, 677);
                    }
                    if ($scope.consentCheck === "2") {
                        drawCheckBox(ctx, 801, 677);
                    }
                    // 補足情報を描画する
                    ctx.font = "24px 'HiraKakuProN-W6'";
                    // 社員ID
                    ctx.fillText(eigyoinStr, 1350, 2050);
                    // 緯度経度
                    ctx.fillText("（" + idoStr + ", " + keidoStr + "）", 293, 1874);
                    break;
                case "871":
                    // 署名の出力
                    var tempCanvas1 = document.createElement('canvas');
                    tempCanvas1.height = signImg.height * 0.65;
                    tempCanvas1.width = signImg.width * 0.65;
                    var tempCtx1 = tempCanvas1.getContext('2d');
                    tempCtx1.drawImage(signImg, 0, 0, signImg.width * 0.65, signImg.height * 0.65);
                    var tempCanvas2 = document.createElement('canvas');
                    tempCanvas2.height = tempCanvas1.height * 0.65;
                    tempCanvas2.width = tempCanvas1.width * 0.65;
                    var tempCtx2 = tempCanvas2.getContext('2d');
                    tempCtx2.drawImage(signImg, 0, 0, tempCanvas1.width * 0.65, tempCanvas1.height * 0.65);
                    ctx.drawImage(tempCanvas2, 526, 870, tempCanvas2.width * 0.60, tempCanvas2.height * 0.60);
                    tempCanvas1.height = 0;
                    tempCanvas1.width = 0;
                    tempCanvas2.height = 0;
                    tempCanvas2.width = 0;
                    // 補足情報を描画する
                    ctx.font = "24px 'HiraKakuProN-W6'";
                    // 社員ID
                    ctx.fillText(eigyoinStr, 1250, 2108);
                    // 緯度経度
                    ctx.fillText("（" + idoStr + ", " + keidoStr + "）", 385, 1655);
                    break;
                default:
                    break;
            }
        };
        // 署名モーダル解除用処理
        var modalRelease = function () {
            // 背景固定解除
            scrollUnlock();
            // オーバーレイを削除
            $('.modal-overlay').remove();
            $('#G1410-02').fadeOut('fast');
        };
        // データの位置を作成する
        var drawCheckBox = function (ctx, xPos, yPos) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPos + 15, yPos + 15);
            ctx.lineTo(xPos + 12, yPos + 18);
            ctx.lineTo(xPos + 22, yPos + 29);
            ctx.lineTo(xPos + 50, yPos + 3);
            ctx.lineTo(xPos + 22, yPos + 23);
            ctx.lineTo(xPos + 15, yPos + 15);
            ctx.closePath();
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.stroke();
        };
        /**
         *   確定タップ
         */
        $scope.nextBtnClick = function () {
            // ボタン連打防止確認
            if (isStopBtn)
                return;
            // ボタン連打防止開始
            isStopBtn = true;
            // 背景固定
            scrollLock();
            // ぼかしの背景のため、bodyにクラスを追加
            $('body').addClass('is-modal-open');
            // 「G：画面」モーダル表示
            $("#G1410-03").modal("show");
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID, PAGE_ID_COMP, FIX_BTN_NAME);
            // ボタン連打防止解除
            isStopBtn = false;
        };
        /**
         *  戻るタップ
         */
        $scope.backBtnClick = function () {
            // ボタン連打防止確認
            if (isStopBtn)
                return;
            // ボタン連打防止開始
            isStopBtn = true;
            // 背景固定解除
            scrollUnlock();
            // 前画面へ遷移する。遷移先は共通処理「APPBIZ-00010：業務共通領域」により取得する。
            var path = AppBizCom.DataHolder.getPrevRoutePath();
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID, BEHIND_PAGE_ID, RETURN_BTN_NAME);
            // 画面遷移
            logicCom.locationPath(path, clearCanvas, callbackFLG, connectionErrorCallback);
        };
        /**
         *  確認ダイアログの「はい」ボタンタップ時
         */
        $scope.confirmYes = function () {
            // ボタン連打防止確認
            if (isStopBtn)
                return;
            // ボタン連打防止開始
            isStopBtn = true;
            // 背景固定解除
            scrollUnlock();
            // 営業員情報
            var eigyoinJoho = getObject(eFormInfo.EIGYOIN_JOHO);
            // 申し込み補足情報
            var moskmHsk = getObject(eFormInfo.MOSKM_HSK);
            // UUID
            moskmHsk.UUID = AppComDevice.getUuid();
            eFormInfo.MOSKM_HSK = moskmHsk;
            // 申込データ(電子帳票)の設定
            AppBizCom.DataHolder.setEFormInfo(eFormInfo);
            // 画像データの設定
            AppBizCom.DataHolder.setImageData(imageData);
            // アクションログの値設定
            var msgParam = {};
            msgParam['MOSKM_KBN'] = { value: $scope.consentCheck };
            // アクションログ出力 actionはundefinedにする GPSはtrueにする 
            logicCom.btnTapLog(PAGE_ID_COMP, PAGE_ID_SENT, YES_BTN_NAME, msgParam, true);
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // 画面遷移
            logicCom.locationPath('applicationComp', clearCanvas, callbackFLG, connectionErrorCallback);
        };
        /**
         *  確認ダイアログの「いいえ」ボタンタップ時
         */
        $scope.confirmNo = function () {
            // ボタン連打防止確認
            if (isStopBtn)
                return;
            // ボタン連打防止開始
            isStopBtn = true;
            // 背景固定解除
            scrollUnlock();
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_COMP, PAGE_ID, NO_BTN_NAME);
            // ボタン連打防止解除
            isStopBtn = false;
        };
    }]);
