/// <reference path="../reference.d.ts" />

App.controller('addressSearchController', ['$scope', 'AppBizCom', 'logicCom', 'AppBizMsg', '$controller', 
    function ($scope, AppBizCom, logicCom, AppBizMsg, $controller) {
        // DB検索異常の場合、エラーモーダル画面を出すため、エラーモーダルのコントローラを導入
        $controller('errorInfoModalCtrl', {$scope: $scope});

        var STATUS = {
            SELECT : '1', // 選択
            CANCEL : '2', // キャンセル
            CLOSE : '3' // 閉じる
        };

        var zipCodeId; // 住所検索画面の画面ID
        var mainPageId; // 呼び出し元画面の画面ID
        var stopBtnEventFLG = false; // ボタン連打防止フラグ
        var callBack; // 下記パラメータがあるコールバック（操作結果を返却する用）
        // パラメータ1 status: （'1': 選択, '2': キャンセル, '3': 閉じる）
        // パラメータ2 result: {zipcodeup: 'xxxx', zipcodedown: 'xxxx', tiiki_cd: 'xxxx', address: 'xxxx', addresskana: 'xxxx'} or undefined

        var init = function () {
            // 住所検索画面内部変数初期化
            zipCodeId = undefined; // 住所検索画面の画面ID
            mainPageId = undefined; // 呼び出し元画面の画面ID
            stopBtnEventFLG = false; // ボタン連打防止フラグ
            callBack = undefined; // コールバック関数（操作結果を返却する用）
        };

        // イベント１～３：住所検索「初期表示」時
        /**
         * 住所検索
         * 
         * @param {string} fromId - 呼び出し元画面の画面ID
         * @param {string} toId - 住所検索画面の画面ID
         * @param {string} zipCodeUp - 郵便番号上3桁
         * @param {string} zipCodeDown - 郵便番号下4桁
         * @param {funtion} func - コールバック関数
         */
        $scope.zipcodeSearch = function (fromId, toId, zipCodeUp, zipCodeDown, func) {
            init();
            // 呼び出し元画面のスクロール禁止
            scrollLock();
            zipCodeId = toId;
            mainPageId = fromId;
            callBack = (angular.isFunction(func)) ? func : undefined;

            // 「APPBIZ-C003：住所検索機能」の郵便番号より住所を検索する処理を呼び出す
            AppBizCom.AddSearch.searchFromZip(zipCodeUp, zipCodeDown, 
                function(result) { // 検索成功時コールバック関数
                    // アプリログ出力
                    logicCom.infoLog('住所検索成功');

                    // 住所検索画面を表示
                    $('#zipCodeModal').modal('show');
                    // ぼかしの背景のため、bodyにクラスを追加
                    $('body').addClass('is-modal-open');

                    // 「画面タイトル」の郵便番号の初期表示
                    $scope.zipCode = (zipCodeDown) ? ('〒' + zipCodeUp + '－' + zipCodeDown) : ('〒' + zipCodeUp);

                    // 「画面タイトル」の住所検索結果の初期表示
                    if (result.errFlag) {
                        // 検索結果が100件超過の時
                        // アプリログ出力
                        logicCom.infoLog('住所検索結果（100件超過）', result.recordLth);
                        // 成功時モーダルを非表示
                        $scope.zipCodeModalSuccess = false;
                        $scope.zipCodeModalError_noResult = false;
                        // 失敗時モーダルを表示
                        $scope.zipCodeModalError = true;
                        $scope.zipCodeModalError_excess = true;
                    } else {
                        var recordLth = result.rows.length; // レコード件数
                        if (recordLth == 0) {
                            // 検索結果が0件の時
                            // アプリログ出力
                            logicCom.infoLog('住所検索結果（結果なし）', recordLth);
                            // 成功時モーダルを非表示
                            $scope.zipCodeModalSuccess = false;
                            $scope.zipCodeModalError_excess = false;
                            // 失敗時モーダルを表示
                            $scope.zipCodeModalError = true;
                            $scope.zipCodeModalError_noResult = true;
                        } else {
                            // 検索結果が1件以上100件以下の時
                            // アプリログ出力
                            logicCom.infoLog('住所検索結果（1件以上100件以下）', recordLth);
                            // 失敗時モーダルを非表示
                            $scope.zipCodeModalError = false;
                            $scope.zipCodeModalError_noResult = false;
                            $scope.zipCodeModalError_excess = false;
                            // 成功時モーダルを表示
                            $scope.zipCodeModalSuccess = true;
                            $scope.addressArr = {}; // 絞り込んだ住所検索結果を初期化（住所検索画面へ反映する）
                            for (var index = 0; index < recordLth; index++) {
                                $scope.addressArr[index] = {}; // 初期化
                                $scope.addressArr[index].zipcode = result.rows.item(index).KENSKYO_YUBINNO_MAE + '－' + result.rows.item(index).KENSKYO_YUBINNO_ATO // 郵便番号
                                $scope.addressArr[index].zipcodeup = result.rows.item(index).KENSKYO_YUBINNO_MAE; // 郵便番号上3桁
                                $scope.addressArr[index].zipcodedown = result.rows.item(index).KENSKYO_YUBINNO_ATO; // 郵便番号下4桁
                                $scope.addressArr[index].tiiki_cd = result.rows.item(index).TIIKI_C; // 地域コード
                                $scope.addressArr[index].address = result.rows.item(index).TIIKI_C_ADDR; // 地域コード住所
                                $scope.addressArr[index].addresskana = result.rows.item(index).TIIKI_C_ADDR_KANA; // 地域コード住所カナ
                            }
                        }
                    }
                    // 画面表示の再描画
                    $scope.$applyAsync();
                },
                // 失敗時コールバック関数
                function(error) {
                    // システムエラー定義
                    var MSG_06E = { CODE: 'KKAP-CM000-06E', BIND: [] };
                    var MSG_07E = { CODE: 'KKAP-CM000-07E', BIND: [] };
                    var SYSTEM_ERR_TITLE = AppBizMsg.getMsg(MSG_06E.CODE, MSG_06E.BIND);
                    var SYSTEM_ERR_CONTENTS = AppBizMsg.getMsg(MSG_07E.CODE, MSG_07E.BIND);
                    logicCom.errorLog('住所検索失敗', error);
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(SYSTEM_ERR_TITLE, SYSTEM_ERR_CONTENTS);
                    // ぼかしの背景のため、bodyにクラスを追加
                    $('body').addClass('is-modal-open');
                }
            );
        };

        // イベント４：住所検索「選択」ボタンタップ時
        /**
         * 住所選択
         * 
         * @param {num} index - 選択した住所検索結果のインデックス
         */
        $scope.zipcodeSelect = function (index) {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            // ログ用に選択した郵便番号のデータを格納
            var municStr = $scope.addressArr[index].zipcodeup + '-' + $scope.addressArr[index].zipcodedown + ' ' + $scope.addressArr[index].address;
            // 住所選択の結果を返却
            var addrSearchRlt = {};
            addrSearchRlt['zipcodeup'] = $scope.addressArr[index].zipcodeup;
            addrSearchRlt['zipcodedown'] = $scope.addressArr[index].zipcodedown;
            addrSearchRlt['tiiki_cd'] = $scope.addressArr[index].tiiki_cd;
            addrSearchRlt['address'] = $scope.addressArr[index].address;
            addrSearchRlt['addresskana'] = $scope.addressArr[index].addresskana;
            // アクションログの出力
            logicCom.btnTapLog(zipCodeId, mainPageId, '選択', municStr);
            // 呼び出し元画面へ状態と選択結果を告知
            callBack && callBack(STATUS.SELECT, addrSearchRlt);
            // メモリ解除するため、検索結果をクリアする
            $scope.zipCode = undefined;
            $scope.addressArr = null;
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#zipCodeModal_overflowScroll').scrollTop(0);
            // 住所検索画面を非表示
            $('#zipCodeModal').modal('hide');
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // 呼び出し元画面のスクロール禁止を解除
            scrollUnlock();
            // モーダル画面が閉じられた後で、ボタン押下中の状態を解除
            stopBtnEvent('#zipCodeModal');
        };

        // イベント５：住所検索「キャンセル」ボタンタップ時
        $scope.zipCancelBtnClick = function () {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            // アクションログ出力
            logicCom.btnTapLog(zipCodeId, mainPageId, 'キャンセル');
            // 呼び出し元画面へ状態を告知
            callBack && callBack(STATUS.CANCEL);
            // メモリ解除するため、検索結果をクリアする
            $scope.zipCode = undefined;
            $scope.addressArr = null;
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#zipCodeModal_overflowScroll').scrollTop(0);
            // 住所検索画面を非表示
            $('#zipCodeModal').modal('hide');
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // 呼び出し元画面のスクロール禁止を解除
            scrollUnlock();
            // モーダル画面が閉じられた後で、ボタン押下中の状態を解除
            stopBtnEvent('#zipCodeModal');
        };

        // イベント６：住所検索「閉じる」ボタンタップ時
        $scope.zipCloseBtnClick = function () {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            // アクションログ出力
            logicCom.btnTapLog(zipCodeId, mainPageId, '閉じる');
            // 呼び出し元画面へ状態を告知
            callBack && callBack(STATUS.CLOSE);
            // メモリ解除するため、検索結果をクリアする
            $scope.zipCode = undefined;
            $scope.addressArr = null;
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#zipCodeModal_overflowScroll').scrollTop(0);
            // 住所検索画面を非表示
            $('#zipCodeModal').modal('hide');
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // 呼び出し元画面のスクロール禁止を解除
            scrollUnlock();
            // モーダル画面が閉じられた後で、ボタン押下中の状態を解除
            stopBtnEvent('#zipCodeModal');
        };

        /**
         * モーダル画面が閉じられた後で、ボタン押下中の状態を解除
         * 
         * @param {string} id - モーダル画面のidセレクター（例: '#xxxxxxxx'）
         */
        var stopBtnEvent = function (id) {
            $(id).off('hidden.bs.modal').on('hidden.bs.modal', function (e) {
                stopBtnEventFLG = false;
            });
        };

        // モーダル画面が表示される時、呼び出し元画面をスクロールできないように制御
        var scrollLock = function () {
            $('.scrollArea').css({'-webkit-overflow-scrolling':'auto'});
        };
        // モーダル画面が閉じられる時、呼び出し元画面をスクロールできるように制御
        var scrollUnlock = function () {
            $('.scrollArea').css({'-webkit-overflow-scrolling':'touch'});
        };

        init();
    }]);