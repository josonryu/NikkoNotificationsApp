/// <reference path="../reference.d.ts" />
App.controller('SimilarModalCtrl', ['$scope', '$rootScope', '$timeout', 'logicCom', 'AppBizCom', '$compile', 'appConst',
    function ($scope, $rootScope, $timeout, logicCom, AppBizCom, $compile, appConst) {

        // 類似文字確認画面ID
        var similarCheckModalId = 'G1520-01';
        // 類似文字情報オブジェクト
        var similarResigtInfo: any = {};

        // 確定ボタンタップ時コールバック関数
        var similarButtonCallback = undefined;
        // 類似文字確認画面呼び出し画面ID
        var similarCheckPrevId = undefined;
        // 類似文字情報オブジェクトID（画面表示）             
        var currID = undefined;

        // 類似文字情報リスト（画面表示）
        $scope.checkCharList = undefined;
        // 選択した類似文字説明（画面表示）
        $scope.inputedChar = undefined;
        // 選択した類似文字の候補リスト（画面表示）
        $scope.editableList = undefined;
        // 選択した類似文字情報
        $scope.activeChar = undefined;

        /**
         * 類似文字確認画面リンクを追加する処理。
         * 
         * @param {string} id - 類似文字確認画面リンクを追加する項目ID
         */
        var charEditLinkAdd = (id): void => {

            // リンク表示場所(親element)取得
            var target = $('#' + id);
            var rowDiv = target.parents('.input-check-row');
            if (rowDiv.length == 0) {
                throw new Error('類似文字チェック項目(' + id + ')の親DivのClassに「input-check-row」が設定されていない');
            }

            var nextEle = rowDiv.next();

            // リンクHTMLを作成
            var html = '<div class="similarArea" id="' + id + 'Similar"><a class="similarLink" data-toggle="modal" ng-click="charEditModalOpen(\'' + id + '\')"><span class="linkCharCorrect_label">'
                + appConst.SIMILAR_LINK_LABEL + '</span>' + AppBizCom.Msg.getMsg('KKAP-CM000-16E', [similarResigtInfo[id].name]) + '</a></div>';

            // エラーメッセージの下に表示するように
            nextEle.hasClass('err-message') && (rowDiv = nextEle) && (nextEle = nextEle.next());

            var compileEl = $compile(html)($scope);
            // リンクを表示
            if (nextEle.hasClass('similar-link')) {
                nextEle.children().last().after(compileEl);
            } else {
                rowDiv.after('<div class="similar-link"></div>');
                rowDiv.next().html(compileEl);
            }
        };

        // リスナーを追加
        var destoryListener = $rootScope.$on('registSimlarInfo', function (evnet, args) {

            // パラメータチェック
            if (!args || !args.id || !args.chkList || args.name == undefined || args.parentI == undefined || args.childI == undefined) {
                throw new Error('類似文字確認画面情報設定不正。ID: ' + args.id);
            }

            // 情報保存
            similarResigtInfo[args.id] = args;

            // リンクを作成
            charEditLinkAdd(args.id);
        });

        /**
         * 類似文字リックを削除。
         */
        var clearSimlarLink = function (id) {
            // 類似文字リンクを削除
            var parnet = $('#' + id + 'Similar').parent();
            $('#' + id + 'Similar').remove();

            // 類似文字リンクの親Divに他の類似文字リンクがない場合、親Divも削除
            parnet.children().length == 0 && parnet.remove();

            // 親ブロックの赤枠をクリア
            var areaDiv = parnet.parents('.input-check-area');
            areaDiv.find('.err').length == 0 && areaDiv.removeClass('err');
        }

        /**
         * モーダル初期化処理（ng-init時使う）
         * １．モーダルが表示するとき、ぼかしする
         * ２．モーダルが表示するとき、呼び出し元画面がスクロールできないにする
         */
        $scope.modalInit = function () {
            $("#" + similarCheckModalId).on("show.bs.modal", () => {
                $("body").addClass('is-modal-open');
                $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
            });
            $("#" + similarCheckModalId).on("hidden.bs.modal", () => {
                $("body").removeClass('is-modal-open');
                $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
            });
        }

        // 画面廃棄時、リスナーも廃棄する
        $scope.$on('$destroy', function () {
            destoryListener();
            $("#" + similarCheckModalId).off("show.bs.modal");
            $("#" + similarCheckModalId).off("hidden.bs.modal");
        });

        /**
         * 類似文字確認画面を表示する。
         * 
         * @param {string} id - 類似文字確認画面リンクを追加する項目ID
         */
        $scope.charEditModalOpen = (id): void => {

            $scope.checkCharList = similarResigtInfo[id].chkList;
            similarButtonCallback = similarResigtInfo[id].callback;
            similarCheckPrevId = similarResigtInfo[id].pageID;
            currID = id;

            $timeout(function () {
                // 最初の類似文字を選択
                $scope.charSelect(similarResigtInfo[id].parentI, similarResigtInfo[id].childI, true);
                // 類似文字確認画面を表示する。
                $('#' + similarCheckModalId).modal('show');

                // アクションログ出力
                logicCom.btnTapLog(similarCheckPrevId, similarCheckModalId, AppBizCom.Msg.getMsg('MSG-STRING-002', [similarResigtInfo[id].name]));
            }, 0);
        }

        /**
         * 類似文字確認画面で文字を選択する。
         * 
         * @param {string} parentI - チェック対象文字の親index（親配列）
         * @param {string} childI - チェック対象文字の親index（子配列）
         * @param {boolean} kubun - 自動選択
         */
        $scope.charSelect = (parentI, childI, kubun = false): void => {

            var char = $scope.checkCharList[parentI][childI];

            // 選択した文字をチェックして、類似文字だたら、変更する
            if (char.similarDefine && char.editable) {

                // アクションログ出力(初期表示の場合自動選択するのを出力しない)
                if (!kubun) {
                    logicCom.btnTapLog(similarCheckModalId, similarCheckModalId, '\"' + char.char + '\"');
                }

                // 活性のCSSを追加
                $("td.similarchar").removeClass('active');
                $('#char' + parentI + '-' + childI).addClass('active');

                $scope.activeChar = { parentI: parentI, childI: childI };
                $scope.inputedChar = char.similarDefine.description + '（' + char.similarDefine.target + '）';
                $scope.editableList = char.similarDefine.editAbleList;
            }
        }

        /**
         * 類似文字確認画面で文字を変更する。
         * 
         * @param {string} item - 変更対象文字の説明内容
         */
        $scope.charEdit = (item): void => {
            $scope.inputedChar = item.description + '（' + item.target + '）';
            $scope.editableList = item.editAbleList;

            // 選択した文字を入替
            var tmpParentI = $scope.activeChar.parentI;
            var tmpChildI = $scope.activeChar.childI;
            var seleced = $scope.checkCharList[tmpParentI][tmpChildI];
            seleced.char = item.target;
            seleced.editableList = item.editAbleList;

            // チェックリストに該当文字の変更後情報を更新
            $scope.checkCharList[tmpParentI][tmpChildI].char = item.target;
            $scope.checkCharList[tmpParentI][tmpChildI].similarDefine = item;
            $scope.checkCharList[tmpParentI][tmpChildI].editable = true;

            // アクションログ出力
            logicCom.btnTapLog(similarCheckModalId, similarCheckModalId, AppBizCom.Msg.getMsg('MSG-STRING-003', [item.description + '（' + item.target + '）に変換する']));
        }

        /**
         * 類似文字確認画面で確定ボタン押下時処理
         * 
         */
        $scope.confirmChar = (): void => {
            // アクションログ出力
            logicCom.btnTapLog(similarCheckModalId, similarCheckPrevId, '確定');

            // 確定ボタンタップ時コールバックセット
            if (typeof similarButtonCallback == 'function') {
                var newStr = $scope.checkCharList.reduce((res, arr) => res = res + arr.reduce((line, char) => line = line + char.char, ''), '');
                similarButtonCallback(newStr);
            }

            // 類似文字リックを削除
            clearSimlarLink(currID);

            // 類似文字情報をクリア
            $scope.activeChar = undefined;
            $scope.checkCharList = undefined;
            $scope.editableList = undefined;
            $scope.inputedChar = undefined;
            similarResigtInfo[currID] = undefined;
            similarButtonCallback = undefined;
            similarCheckPrevId = undefined;
            currID = undefined;
        }

    }]);
