// <reference path="../reference.d.ts" />
App.controller('detailModalController', ['logicCom', '$scope', '$timeout',
    function (logicCom, $scope, $timeout) {
        /** ボタン連打防止フラグ. */
        var stopBtnEventFLG = false;
        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };
        var scrollUnlock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
        };
        /**
         * SFJ-24:詳細リンク機能
         * 「くわしくはこちら」表示
         *
         * @param {string} backId - 呼出し元の画面の画面ID（ログ出力用）
         * @param {string} modalId - 呼出し先のモーダルの画面ID
         * @param {string} itemId - 呼出し先のモーダルの項目ID（ログ出力用）
         *
         * ログ出力内容の修正によりitemIdは現在利用していない
         *
         */
        $scope.detailModalReset = function (backId, modalId, itemId) {
            var prop = modalId.replace('-', '_');
            $scope['G1080_06'] = false;
            $scope['G1080_07'] = false;
            $scope['G1080_08'] = false;
            $scope['G1080_09'] = false;
            $scope['G1080_10'] = false;
            $scope['G1080_11'] = false;
            $scope['G1080_12'] = false;
            $scope['G1080_13'] = false;
            $scope['G1080_14'] = false;
            $scope['G1080_15'] = false;
            $scope['G1080_16'] = false;
            $scope['G1080_17'] = false;
            $scope['G1080_18'] = false;
            $scope['G1080_19'] = false;
            $scope['G1080_20'] = false;
            $scope['G1080_21'] = false;
            $scope['G1080_22'] = false;
            $scope['G1140_03'] = false;
            $scope['G1260_02'] = false;
            $scope.backId = backId;
            $scope.modalId = modalId;
            // ぼかしの背景のため、bodyにクラスを追加
            $('body').addClass('is-modal-open');
            $scope[prop] = true;
            $timeout(function () {
                // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
                $('#linkModal_overflowScroll').scrollTop(0);
            }, 200);
            // アクションログ出力
            logicCom.btnTapLog(backId, modalId, 'くわしくはこちら');
            scrollLock();
        };
        /**
         * SFJ-24:詳細リンク機能
         * 詳細リンク閉じるボタン処理
         *
         */
        $scope.modalCancelBtnClick = function () {
            var fromPopup;
            var toMainPage;
            var btnName = '閉じる';
            // ボタン連打防止フラグ	
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            ;
            fromPopup = $scope.modalId;
            toMainPage = $scope.backId;
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#linkModal_overflowScroll').scrollTop(0);
            // アクションログ出力
            logicCom.btnTapLog(fromPopup, toMainPage, btnName);
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            scrollUnlock();
            // ボタン連打防止フラグ
            stopBtnEventFLG = false;
        };
    }]);
