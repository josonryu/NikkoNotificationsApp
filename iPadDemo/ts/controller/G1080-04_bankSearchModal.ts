/// <reference path="../reference.d.ts" />

App.controller('bankSearchController', ['$scope', '$timeout', 'AppBizCom', 'logicCom', '$controller', 'AppBizMsg', 'AppLgcMultiCheck',
    function ($scope, $timeout, AppBizCom, logicCom, $controller, AppBizMsg, AppLgcMultiCheck) {
        // DB検索異常の場合、エラーモーダル画面を出すため、エラーモーダルのコントローラを導入
        $controller('errorInfoModalCtrl', {$scope: $scope});

        // 金融機関検索時の除外の金融機関リスト(金融機関コードの配列)
        var NOT_TARGETS = [
            '0009', // 三井住友銀行
            '9900'  // ゆうちょ銀行
        ];

        // システムエラー定義
        var MSG_06E = { CODE: 'KKAP-CM000-06E', BIND: [] };
        var MSG_07E = { CODE: 'KKAP-CM000-07E', BIND: [] };
        var SYSTEM_ERR_TITLE = AppBizMsg.getMsg(MSG_06E.CODE, MSG_06E.BIND);
        var SYSTEM_ERR_CONTENTS = AppBizMsg.getMsg(MSG_07E.CODE, MSG_07E.BIND);

        // 操作状態のステータス定義
        var STATUS = {
            ORG_CLOSE : '1', // 「金融機関検索」キャンセル、および「金融機関検索」閉じる
            BRANCH_CONFIRM : '2', // 「支店検索」確定
            BRANCH_CLOSE : '3', // 「支店検索」キャンセル、および「支店検索」閉じる
        };

        // 金融機関検索画面内部変数
        var orgModalId; // 金融機関検索画面の画面ID
        var branchModalId; // 支店検索画面の画面ID
        var mainPageId; // 呼び出し元画面の画面ID
        var txtOrgCode; // 支店検索用の金融機関コード
        var txtOrgName; // 支店検索用の金融機関名
        var stopBtnEventFLG = false; // ボタン連打防止フラグ
        var callBack; // 下記パラメータがあるコールバック（操作結果を返却する用）
        // パラメータ1 status: 操作状態のステータス定義を参照
        // パラメータ2 result: {orgCode: 'xxxx', orgName: 'xxxx', branchCode: 'xxxx', branchName: 'xxxx'} or undefined
        var params; // コールバック関数用のパラメータ（呼び出し元画面自分で使う）

        var init = function () {
            // 画面入力項目定義をスコープへ設定
            $scope.bankSearchInput = angular.copy(bankSearchInputData);
            // 画面入力項目初期化
            $scope.BS_MODAL_MODEL = {};
            $scope.BS_MODAL_MODEL.TXT_ORG_WORD = undefined;
            $scope.BS_MODAL_MODEL.TXT_BRANCH_WORD = undefined;
            $scope.bsSearchResultIsShown = false; // 金融機関・支店検索結果表示状態管理フラグ
            // 金融機関検索画面内部変数初期化
            orgModalId = undefined; // 金融機関検索画面の画面ID
            branchModalId = undefined; // 支店検索画面の画面ID
            mainPageId = undefined; // 呼び出し元画面の画面ID
            txtOrgCode = undefined; // 支店検索用の金融機関コード
            txtOrgName = undefined; // 支店検索用の金融機関名
            stopBtnEventFLG = false; // ボタン連打防止フラグ
            callBack = undefined; // コールバック関数（操作結果を返却する用）
            params = undefined; // コールバック関数用のパラメータ（呼び出し元画面自分で使う）
        };

        // G1080-04 イベント１：金融機関検索「初期表示」時
        /**
         * 金融機関検索初期表示
         * 
         * @param {string} mainId - 呼び出し元画面の画面ID
         * @param {string} orgId - 金融機関検索画面の画面ID
         * @param {string} branchId - 支店検索画面の画面ID
         * @param {function} func - コールバック関数（省略の場合、undefinedである）
         * @param {Array} param - コールバック関数用のパラメータ（省略の場合、空配列[]である）
         */
        $scope.searchFacilityBtnClick = function (mainId, orgId, branchId, func, ...param) {
            init();
            mainPageId = mainId;
            orgModalId = orgId;
            branchModalId = branchId;
            callBack = (angular.isFunction(func)) ? func : undefined;
            params = param;

            // 入力項目「金融機関名」エラークリア
            AppBizCom.Msg.clearError('txtSearchWordFacility');
            // 呼び出し元画面のスクロール禁止
            scrollLock();
            // 金融機関検索画面を表示
            $("#bankSearchModal").modal("show");
            // ぼかしの背景のため、bodyにクラスを追加
            $('body').addClass('is-modal-open');
            // フッターのボタン名設定
            $scope.bsFooterBtnName = "キャンセル";
            // 検索結果0件の金融機関検索結果表示領域を非表示
            $scope.bsSearchResultIsShown0ken = false;
            // 検索結果1件以上の金融機関検索結果表示領域を非表示
            $scope.bsSearchResultIsShown = false;
        };

        // G1080-04 イベント２：金融機関検索用の「検索」ボタンタップ時
        $scope.showSearchFacilityResult = function () {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            var keyboardShowing = (undefined == (<any>window).cordova) ? false : (cordova.plugins.Keyboard.isVisible);
            // 入力項目「金融機関名」エラークリア
            AppBizCom.Msg.clearError('txtSearchWordFacility');
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#bankSearchModal_overflowScroll').scrollTop(0);
            // 画面表示を初期化
            $scope.bsFooterBtnName = "キャンセル";
            $scope.bsSearchResultIsShown0ken = false;
            $scope.bsSearchResultIsShown = false;
            // 金融機関名の入力チェック
            var inputVal = $scope.BS_MODAL_MODEL.TXT_ORG_WORD;
            var chkResult = AppLgcMultiCheck.multiInputCheck(bankSearchInputData, $scope.BS_MODAL_MODEL);
            var msgParam = chkResult[1];

            if (!chkResult[0]) {
                // 「APPBIZ-C004：金融機関検索機能」の金融機関名称より金融機関コードを検索する処理を呼び出す
                AppBizCom.BankSearch.searchFromBkNm(inputVal, 
                    function(result) { // 検索成功時コールバック関数
                        var recordLth = result.rows.length; // レコード件数
                        $scope.finResult = {}; // 検索結果を初期化（金融機関検索画面へ反映する）
                        for (var index = 0; index < recordLth; index++) {
                            var tmpCode = result.rows.item(index).BK_C;
                            // 「金融機関検索時の除外の金融機関リスト」に該当インデックスの金融機関コードが存在すれば、該当インデックスをスキップする
                            if (NOT_TARGETS.indexOf(tmpCode) >= 0) {
                                continue;
                            }
                            $scope.finResult[index] = {}; // 初期化
                            $scope.finResult[index].code = tmpCode; // 金融機関コード
                            $scope.finResult[index].name = result.rows.item(index).BK_FORMNM_KNJ; // 金融機関正式名（漢字
                        }
                        recordLth = Object.getOwnPropertyNames($scope.finResult).length;
                        // アプリログ出力                        
                        logicCom.infoLog('金融機関検索成功件数：' + recordLth + '件');

                        // 検索結果表示ラベルの初期表示
                        $scope.inputSearchFinOrg = inputVal;
                        // 金融機関検索結果表示領域の初期表示
                        if (recordLth == 0) {
                            // 検索結果0件
                            // フッターのボタン名設定
                            $scope.bsFooterBtnName ="閉じる";
                            // 検索結果0件の金融機関検索結果表示領域を表示
                            $scope.bsSearchResultIsShown0ken = true;
                            // 検索結果1件以上の金融機関検索結果表示領域を非表示
                            $scope.bsSearchResultIsShown = false;
                        } else {
                            // 検索結果1件以上
                            // 検索結果0件の金融機関検索結果表示領域を非表示
                            $scope.bsSearchResultIsShown0ken = false;
                            // 検索結果1件以上の金融機関検索結果表示領域を表示
                            $scope.bsSearchResultIsShown = true;
                        }
                        // 画面表示の再描画
                        if (keyboardShowing) {
                            // キーボード表示中の場合は閉じられるのを待って再描画
                            $timeout(function () {
                                $scope.$applyAsync();
                            }, 500);
                        } else {
                            $scope.$applyAsync();
                        }
                        // ボタン押下中の状態を解除
                        stopBtnEventFLG = false;
                    },
                    // 失敗時コールバック関数
                    function(error) {
                        // アクションログ出力
                        logicCom.errorLog('金融機関検索失敗', error);
                        // 金融機関検索画面を非表示
                        $("#bankSearchModal").modal("hide");
                        // ぼかしの背景を消すため、bodyにクラスを削除
                        $('body').removeClass('is-modal-open');
                        // エラーダイアログを表示する
                        $scope.openErrorInfo(SYSTEM_ERR_TITLE, SYSTEM_ERR_CONTENTS);
                        // ボタン押下中の状態を解除
                        stopBtnEventFLG = false;
                    }
                );
                // 入力チェック成功時アクションログ出力
                logicCom.btnTapLog(orgModalId, orgModalId, '検索', msgParam);
            } else {
                // ボタン押下中の状態を解除
                stopBtnEventFLG = false;
                // 入力チェックエラー時アクションログ出力
                logicCom.btnTapErrLog(orgModalId, orgModalId, '検索', msgParam);
            }
        };

        // G1080-04 イベント３：金融機関検索用の「支店検索」ボタンタップ時
        /**
         * 支店選択
         * 
         * @param {string} selectOrgCode - 金融機関コード
         * @param {string} selectOrgName - 金融機関正式名（漢字
         */
        $scope.facilityConfirmBtnClick = function (selectOrgCode, selectOrgName) {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            // アクションログ出力
            var finOrgStr = selectOrgCode + '-' + selectOrgName;
            logicCom.btnTapLog(orgModalId, branchModalId, '支店検索', finOrgStr);
            // メモリ解除するため、検索結果をクリアする
            $scope.inputSearchFinOrg = undefined;
            $scope.finResult = null;
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#bankSearchModal_overflowScroll').scrollTop(0);
            // 金融機関検索画面を非表示
            $("#bankSearchModal").modal("hide");
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // 呼び出し元画面のスクロール禁止を解除
            scrollUnlock();
            // モーダル画面が閉じられた後で、ボタン押下中の状態を解除
            stopBtnEvent('#bankSearchModal');
            // 支店検索「初期表示」を呼び出す
            $scope.searchBranch(selectOrgCode, selectOrgName, mainPageId, branchModalId, callBack, params);
            $scope.bsSearchResultIsShown = false;
        };

        // G1080-04 イベント４～５：金融機関検索用の「キャンセル」、「閉じる」ボタンタップ時
        $scope.cancelFinOrg = function () {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            // アクションログ出力
            logicCom.btnTapLog(orgModalId, mainPageId, $scope.bsFooterBtnName);
            // 呼び出し元画面へ状態を告知
            params.unshift(undefined); // コールバック関数用のパラメータ(index[1])
            params.unshift(STATUS.ORG_CLOSE); // コールバック関数用のパラメータ(index[0])
            callBack && callBack.apply(null, params);
            // メモリ解除するため、検索結果をクリアする
            $scope.inputSearchFinOrg = undefined;
            $scope.finResult = null;
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#bankSearchModal_overflowScroll').scrollTop(0);
            // 金融機関検索画面を非表示
            $("#bankSearchModal").modal("hide");
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // 呼び出し元画面のスクロール禁止を解除
            scrollUnlock();
            // モーダル画面が閉じられた後で、ボタン押下中の状態を解除
            stopBtnEvent('#bankSearchModal');
        };

        // G1080-05 イベント１：支店検索「初期表示」時
        /**
         * 支店検索初期表示（呼び出し元画面から）
         * 
         * @param {string} mainId - 呼び出し元画面の画面ID
         * @param {string} branchId - 支店検索画面の画面ID
         * @param {function} func - コールバック関数（省略の場合、undefinedである）
         * @param {Array} param - コールバック関数用のパラメータ（省略の場合、空配列[]である）
         */
        $scope.searchBranchBtnClick = function (mainId, branchId, func, ...param) {
            var DEFAULT_ORG_CODE = '0009';
            var DEFAULT_ORG_NAME = '三井住友銀行';
            $scope.searchBranch(DEFAULT_ORG_CODE, DEFAULT_ORG_NAME, mainId, branchId, func, param);
        };

        /**
         * 支店検索初期表示（金融機関検索時）
         * 
         * @param {string} orgCode - 金融機関コード
         * @param {string} orgName - 金融機関正式名（漢字
         * @param {string} mainId - 呼び出し元画面の画面ID
         * @param {string} branchId - 支店検索画面の画面ID
         * @param {function} func - コールバック関数（省略の場合、undefinedである）
         * @param {Array} param - コールバック関数用のパラメータ（省略の場合、空配列[]である）
         */
        $scope.searchBranch = function(orgCode, orgName, mainId, branchId, func, param) {
            init();
            txtOrgCode = orgCode;
            txtOrgName = orgName;
            mainPageId = mainId;
            branchModalId = branchId;
            callBack = (angular.isFunction(func)) ? func : undefined;
            params = param;

            // 入力項目「支店名」エラークリア
            AppBizCom.Msg.clearError('txtSearchWordBranch');
            // 呼び出し元画面のスクロール禁止
            scrollLock();
            // 支店検索画面を表示
            $("#branchSearchModal").modal("show");
            // ぼかしの背景のため、bodyにクラスを追加
            $('body').addClass('is-modal-open');
            // フッターのボタン名設定
            $scope.bsFooterBtnName = "キャンセル";
            // 検索結果0件の支店名検索結果表示領域を非表示
            $scope.bsSearchResultIsShown0ken = false;
            // 検索結果1件以上の支店名検索結果表示領域を非表示
            $scope.bsSearchResultIsShown = false;
        };

        // G1080-05 イベント２：支店検索用の「検索」ボタンタップ時
        $scope.showSearchBranchResult = function () {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            var keyboardShowing = (undefined == (<any>window).cordova) ? false : (cordova.plugins.Keyboard.isVisible);
            // 入力項目「支店名」エラークリア
            AppBizCom.Msg.clearError('txtSearchWordBranch');
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#branchSearchModal_overflowScroll').scrollTop(0);
            // 画面表示を初期化
            $scope.bsFooterBtnName = "キャンセル";
            $scope.bsSearchResultIsShown0ken = false;
            $scope.bsSearchResultIsShown = false;
            // 支店名の入力チェック
            var inputVal = $scope.BS_MODAL_MODEL.TXT_BRANCH_WORD;
            var chkResult = AppLgcMultiCheck.multiInputCheck(bankSearchInputData, $scope.BS_MODAL_MODEL);
            var msgParam = chkResult[1];

            if (!chkResult[0]) {
                // 「APPBIZ-C004：金融機関検索機能」の金融機関コードと支店名より金融機関情報を検索する処理を呼び出す
                AppBizCom.BankSearch.searchFromBkCd(txtOrgCode, txtOrgName, inputVal, 
                    function (result) { // 検索成功時コールバック関数
                        // アプリログ出力
                        var recordLth = result.rows.length; // レコード件数
                        logicCom.infoLog('支店検索成功件数：' + recordLth + '件');

                        // 検索結果表示ラベルの初期表示
                        $scope.inputSearchBranch = inputVal;
                        // 支店名検索結果表示領域の初期表示
                        if (recordLth == 0) {
                            // 検索結果0件
                            // フッターのボタン名設定
                            $scope.bsFooterBtnName ="閉じる";
                            // 検索結果0件の支店名検索結果表示領域を表示
                            $scope.bsSearchResultIsShown0ken = true;
                            // 検索結果1件以上の支店名検索結果表示領域を非表示
                            $scope.bsSearchResultIsShown = false;
                        } else {
                            // 検索結果1件以上
                            // 検索結果0件の支店名検索結果表示領域を非表示
                            $scope.bsSearchResultIsShown0ken = false;
                            // 検索結果1件以上の支店名検索結果表示領域を表示
                            $scope.bsSearchResultIsShown = true;
                            $scope.branchResult = {}; // 検索結果を初期化（支店検索画面へ反映する）
                            for (var index = 0; index < recordLth; index++) {
                                $scope.branchResult[index] = {}; // 初期化
                                $scope.branchResult[index].code = (result.rows.item(index).BK_MISE_C).slice(-3); // 金融機関支店コード
                                $scope.branchResult[index].name = result.rows.item(index).BK_MISE_FORMNM_KNJ; // 金融機関支店正式名（漢字
                            }
                        }
                        // 画面表示の再描画
                        if (keyboardShowing) {
                            // キーボード表示中の場合は閉じられるのを待って再描画
                            $timeout(function () {
                                $scope.$applyAsync();
                            }, 500);
                        } else {
                            $scope.$applyAsync();
                        }
                        // ボタン押下中の状態を解除
                        stopBtnEventFLG = false;
                    },
                    // 失敗時コールバック関数
                    function(error) {
                        // アクションログ出力
                        logicCom.errorLog('支店検索失敗', error);
                        // 支店検索画面を非表示
                        $("#branchSearchModal").modal("hide");
                        // ぼかしの背景を消すため、bodyにクラスを削除
                        $('body').removeClass('is-modal-open');
                        // エラーダイアログを表示する
                        $scope.openErrorInfo(SYSTEM_ERR_TITLE, SYSTEM_ERR_CONTENTS);
                        // ボタン押下中の状態を解除
                        stopBtnEventFLG = false;
                    }
                );
                // 入力チェック成功時アクションログ出力
                logicCom.btnTapLog(branchModalId, branchModalId, '検索', msgParam);
            } else {
                // ボタン押下中の状態を解除
                stopBtnEventFLG = false;
                // 入力チェックエラー時アクションログ出力
                logicCom.btnTapErrLog(branchModalId, branchModalId, '検索', msgParam);
            }
        };

        // G1080-05 イベント３：支店検索用の「確定」ボタンタップ時
        /**
         * 支店選択
         * 
         * @param {string} selectBranchCode - 金融機関支店コード
         * @param {string} selectBranchName - 金融機関支店正式名（漢字
         */
        $scope.branchConfirmBtnClick = function (selectBranchCode, selectBranchName) {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            // アクションログ出力
            var branchStr = selectBranchCode + '-' + selectBranchName;
            // 支店選択の結果を返却
            var branchSearchRlt = {};
            branchSearchRlt['orgCode'] = txtOrgCode;
            branchSearchRlt['orgName'] = txtOrgName;
            branchSearchRlt['branchCode'] = selectBranchCode;
            branchSearchRlt['branchName'] = selectBranchName;
            // アクションログの出力
            logicCom.btnTapLog(branchModalId, mainPageId, '確定', branchStr);
            // 呼び出し元画面へ状態と選択結果を告知
            params.unshift(branchSearchRlt); // コールバック関数用のパラメータ(index[1])
            params.unshift(STATUS.BRANCH_CONFIRM); // コールバック関数用のパラメータ(index[0])
            callBack && callBack.apply(null, params);
            // メモリ解除するため、検索結果をクリアする
            $scope.inputSearchBranch = undefined;
            $scope.branchResult = null;
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#branchSearchModal_overflowScroll').scrollTop(0);
            // 支店検索画面を非表示
            $("#branchSearchModal").modal("hide");
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // 呼び出し元画面のスクロール禁止を解除
            scrollUnlock();
            // モーダル画面が閉じられた後で、ボタン押下中の状態を解除
            stopBtnEvent('#branchSearchModal');
        };

        // G1080-05 イベント４～５：支店検索用の「キャンセル」、「閉じる」ボタンタップ時
        $scope.cancelBranch = function () {
            // ボタン押下中の状態をチェックする
            if (!stopBtnEventFLG) {
                // ボタン押下中の状態にする
                stopBtnEventFLG = true;
            } else {
                return;                
            }
            // アクションログ出力
            logicCom.btnTapLog(branchModalId, mainPageId, $scope.bsFooterBtnName);
            // 呼び出し元画面へ状態を告知
            params.unshift(undefined); // コールバック関数用のパラメータ(index[1])
            params.unshift(STATUS.BRANCH_CLOSE); // コールバック関数用のパラメータ(index[0])
            callBack && callBack.apply(null, params);
            // メモリ解除するため、検索結果をクリアする
            $scope.inputSearchBranch = undefined;
            $scope.branchResult = null;
            // モーダル画面内のスクロール位置を上端にリセットするため、scrollTopを行う
            $('#branchSearchModal_overflowScroll').scrollTop(0);
            // 支店検索画面を非表示
            $("#branchSearchModal").modal("hide");
            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
            // 呼び出し元画面のスクロール禁止を解除
            scrollUnlock();
            // モーダル画面が閉じられた後で、ボタン押下中の状態を解除
            stopBtnEvent('#branchSearchModal');
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

        // 画面入力項目定義
        var bankSearchInputData = {
            TXT_ORG_WORD: {
                applyName: 'TXT_ORG_WORD', // 項目の共通領域名
                id: 'txtSearchWordFacility', // 画面項目id
                name: '金融機関名', // 画面項目名
                typeSelect: false, // 入力項目タイプ
                requireString: 'full', // 文字変換タイプ
                handWrite: 'text_all', // 手書き文字認識タイプ
                length: 15, // 最大文字数
                valChangChk: [['isFullString', 'hasForbidChar', 'chkMaxLength']], // 随時入力チェック仕様（値変更時）
                allChk: [['isEmpty'], ['isFullString', 'hasForbidChar', 'chkMaxLength']], // 一括チェック仕様
            },
            TXT_BRANCH_WORD: {
                applyName: 'TXT_BRANCH_WORD', // 項目の共通領域名
                id: 'txtSearchWordBranch', // 画面項目id
                name: '支店名', // 画面項目名
                typeSelect: false, // 入力項目タイプ
                requireString: 'full', // 文字変換タイプ
                handWrite: 'text_all', // 手書き文字認識タイプ
                length: 15, // 最大文字数
                valChangChk: [['isFullString', 'hasForbidChar', 'chkMaxLength']], // 随時入力チェック仕様（値変更時）
                allChk: [['isEmpty'], ['isFullString', 'hasForbidChar', 'chkMaxLength']], // 一括チェック仕様
            }
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