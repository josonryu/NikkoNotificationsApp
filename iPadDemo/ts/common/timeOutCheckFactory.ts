/// <reference path="../reference.d.ts" />

App.factory('timeOutCheck', ['AppCom', 'AppBizMsg', 'AppBizDataHolder',
    function(AppCom, AppBizMsg, AppBizDataHolder){
        // ログレベル区分
        var LEVEL = 'E';
        // メッセージ
        var MSG = 'KKAP-CM000-18E';
        // アクション
        var ACTION = '自動ログアウト';
        // 開始時間
        var timeStartCounter : any;

        var scrollLock = function () {
            $('.scrollArea').css({'-webkit-overflow-scrolling':'auto'});
        }

        /**
         * 指定のタイトル、内容でエラーメッセージ画面を表示する
         * (閉じるボタン無し)
         * @param  {} title
         * @param  {} contents
         */
        var openErrorInfo = function (title, contents) {
            $('#footerMessage').show();
            $('#footerCloseButton').hide();
            $('#txtTitle').html(title);
            $(`#txtContents`).html(contents);
            $("#G1020").modal('show');

            // 数字キーボードよりも前面にエラーメッセージを表示するための対応
            $(".modal-open .modal").css({"z-index": 3000});
            $(".modal-backdrop.fade").css({"z-index": 2999});
        };

        return{
            /**
             * 開始時間を取得する。
             * 
             * @return {Date} 開始時間
             */
            getTimeStartCounter: function () {
                return timeStartCounter;
            },

            /**
             * 開始時間をセットする。
             * 
             * @param {Date} value - 開始時間
             */
            setTimeStartCounter: function (value) {
                timeStartCounter = value;
            },

            /**
             * 開始時間をセットする。
             * 
             * @param {Date} value - 開始時間
             */
            checkTimeOut: function(startTime){

                var endTime : any = new Date();

                var diffTime : number = endTime - startTime;

                var timeOutInit : number = 30 * 60 * 1000;

                if (diffTime < timeOutInit) {
                    return true;
                } else {
                    var loginInfo = AppBizDataHolder.getLoginInfo();
                    // 社員ID
                    var proper = loginInfo.PROPER_C;
                    // 受付者店部課コード
                    var shop = loginInfo.UKETSUKE_MISE_C;
                    // 受付者係コード
                    var section = loginInfo.UKETSUKE_KAKARI_C;

                    // ログイン者データの社員IDに値が存在しない場合，ログイン者無しの値を設定する．
                    if (!proper) {
                        proper = 'noUser';
                        shop = '000';
                        section = '0000';
                    }

                    // ログ出力
                    AppCom.Log.writeLog(proper, shop, section, LEVEL, MSG, ACTION);
                    scrollLock();
                    openErrorInfo(AppBizMsg.getMsg('KKAP-CM000-17E'), AppBizMsg.getMsg('KKAP-CM000-18E'));
                    // ぼかしの背景のため、bodyにクラスを追加
                    $('body').addClass('is-modal-open');

                    return false;
                }
            }
        }
    }
])