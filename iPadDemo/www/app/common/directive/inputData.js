/// <reference path="../../reference.d.ts" />
App.directive('inputData', ['$compile', '$parse', 'AppBizCom', 'AppLgcMultiCheck', 'AppCom', ($compile, $parse, AppBizCom, AppLgcMultiCheck, AppCom) => {
        var findPageID = function (element) {
            var parent = element.parent();
            return parent.length == 1 ? (parent[0].id == "main-div-area" ? element[0].id : findPageID(parent)) : 'unKnowPageID';
        };
        return {
            restrict: 'A',
            priority: 1000,
            require: ['inputData', 'ngModel'],
            link: function (scope, elem, attrs, ctrls) {
                // データを取得
                var nkData = $parse(attrs.inputData)(scope);
                // Inputのみ処理対象にする
                if (elem[0].tagName === 'INPUT') {
                    // 手書き初期化
                    if (nkData.handWrite != undefined) {
                        var handWriteInfo = {
                            id: attrs.id,
                            pageID: attrs.pageId || findPageID(elem),
                            jpName: nkData.name,
                            handWrite: nkData.handWrite,
                        };
                        ctrls[0].setPageID(handWriteInfo.pageID);
                        elem.attr('hand-write', JSON.stringify(handWriteInfo));
                        // Angularjs 自動Trimを取消
                        elem.attr('ng-trim', 'false');
                    }
                    // 数字キーボード初期化
                    if (nkData.numPad != undefined) {
                        elem.attr('num-pad', nkData.numPad);
                    }
                    // 全角・半角変換
                    if (nkData.requireString) {
                        ctrls[1].$viewChangeListeners.push(function () {
                            AppCom.Log.consoleLog('inputData.js', '全角・半角変換（' + JSON.parse(elem.attr("hand-write")).jpName + '）');
                            scope.$eval(ctrls[0].halfFullChange(nkData.requireString));
                        });
                        // 変換後カーソル位置を保持する処理
                        ctrls[0].setBakRender(ctrls[1].$render);
                        ctrls[1].$render = function () {
                            var htmlEl = document.getElementById(attrs.id);
                            var index = htmlEl.selectionStart;
                            var value = ctrls[0].getBakRender()();
                            if (htmlEl == document.activeElement) {
                                var plus = ctrls[0].getSelectIndexplus();
                                htmlEl.setSelectionRange(index + plus, index + plus);
                                ctrls[0].setSelectIndexplus(0);
                            }
                            return value;
                        };
                    }
                    // 長音、ハイフンマイナスをハイフンへ変更する
                    if (nkData.requireHyphen) {
                        ctrls[1].$viewChangeListeners.push(function () {
                            AppCom.Log.consoleLog('inputData.js', '長音、ハイフンマイナス変換（' + JSON.parse(elem.attr("hand-write")).jpName + '）');
                            scope.$eval(ctrls[0].unifyHyphen());
                        });
                    }
                    // 随時チェック(値変更時)
                    if (nkData.valChangChk) {
                        if (!angular.isArray(nkData.valChangChk)) {
                            throw new Error('随時チェック(値変更時)のパラメータは配列ではありません。項目ID: ' + nkData.id);
                        }
                        nkData.valChangChk.length > 0 && ctrls[1].$viewChangeListeners.push(function () {
                            AppCom.Log.consoleLog('inputData.js', '随時チェック(値変更時)');
                            scope.$eval(ctrls[0].anyTimeChk('valChangChk'));
                        });
                    }
                    // 随時チェック(フォーカス外し時)
                    if (nkData.onBlurChk) {
                        if (!angular.isArray(nkData.onBlurChk)) {
                            throw new Error('随時チェック(フォーカス外し時)のパラメータは配列ではありません。項目ID: ' + nkData.id);
                        }
                        if (nkData.onBlurChk.length > 0) {
                            elem.on('blur', function () {
                                if (scope.$$phase) {
                                    AppCom.Log.consoleLog('inputData.js', '随時チェック(フォーカス外し時$evalAsync)');
                                    scope.$evalAsync(ctrls[0].anyTimeChk('onBlurChk'));
                                }
                                else {
                                    AppCom.Log.consoleLog('inputData.js', '随時チェック(フォーカス外し時$apply)');
                                    scope.$apply(ctrls[0].anyTimeChk('onBlurChk'));
                                }
                            });
                        }
                    }
                    if (nkData.needRequireCheck) {
                        var destoryListener = scope.$on(attrs.id + 'AnyTimeChk', function (evnet, args) {
                            AppCom.Log.consoleLog('inputData.js', 'destoryListener');
                            ctrls[0].anyTimeChk(args.type, undefined, undefined, args.isSimilarOnly);
                        });
                        scope.$on('$destroy', function () {
                            destoryListener();
                        });
                    }
                    // 値がundifinedの時、エラーをクリアする。
                    scope.$watch(function () { return ctrls[1].$modelValue; }, function (newValue, oldValue) {
                        newValue !== oldValue && newValue == undefined && ctrls[0].clearErrAndSimlar();
                        newValue !== oldValue && newValue == undefined && ctrls[0].setPreChkValue(undefined);
                        ctrls[0].inputDate.numPad && !oldValue && !newValue && ctrls[0].setPreChkValue(newValue);
                    });
                }
                elem.removeAttr('input-data');
                $compile(elem)(scope);
            },
            controller: function ($scope, $element, $attrs) {
                this.$$scope = $scope;
                this.$$attrs = $attrs;
                this.model = $parse($attrs.ngModel);
                this.inputDate = $parse($attrs.inputData)($scope);
                this.pageID = undefined;
                this.selectIndexplus = 0;
                this.bakRender = undefined;
                this.ele = document.getElementById($attrs.id);
                this.preChkValue = undefined;
                this.setPreChkValue = function (val) {
                    this.preChkValue = val;
                };
                this.setBakRender = function (bakRender) {
                    this.bakRender = bakRender;
                };
                this.getBakRender = function () {
                    return this.bakRender;
                };
                this.setPageID = function (pageID) {
                    this.pageID = pageID;
                };
                this.getSelectIndexplus = function () { return this.selectIndexplus; };
                this.setSelectIndexplus = function (val) { this.selectIndexplus = val; };
                /**
                 * 入力した値をパラメータにて、全角または半角へ変換する処理
                 *
                 * @param {string} mode - 変換モード full：全角へ変換、half：半角へ変換
                 */
                this.halfFullChange = function (mode) {
                    var oldValue = this.model(this.$$scope);
                    if (!oldValue)
                        return;
                    var newValue;
                    if (mode === 'full') {
                        newValue = AppCom.StringUtil.hanToZen(oldValue, true);
                    }
                    else if (mode === 'full_withoutKana') {
                        newValue = AppCom.StringUtil.hanToZen(oldValue, false);
                    }
                    else if (mode === 'half') {
                        newValue = AppCom.StringUtil.zenToHan(oldValue, true);
                    }
                    else if (mode === 'half_withoutKana') {
                        newValue = AppCom.StringUtil.zenToHan(oldValue, false);
                    }
                    else if (mode === 'no_change') {
                        newValue = oldValue;
                    }
                    else {
                        throw new Error('全角・半角変換処理モード不正。Mode: ' + mode);
                    }
                    var oldEnd = this.ele.selectionEnd;
                    this.model.assign(this.$$scope, newValue);
                    this.selectIndexplus = newValue.length - oldValue.length;
                    // キーボードで、入力未確定のままで、手書きモードへ変換する時に、未確定背景を取消ために、一回クリアして、値を再反映する
                    $($element).val('');
                    $($element).val(newValue);
                    this.ele.selectionEnd = this.ele.selectionStart = oldEnd;
                };
                /**
                 * 長音(u+30FC)および、ハイフンマイナス(u+FF0D)が入力された場合にハイフン(u+2010)に文字を置き換える処理
                 *
                 */
                this.unifyHyphen = function () {
                    var oldValue = this.model(this.$$scope);
                    if (!oldValue)
                        return;
                    this.model.assign(this.$$scope, oldValue.replace(/[ー－]/g, "‐"));
                };
                /**
                 * エラーメッセージと類似文字リックを削除。
                 */
                this.clearErrAndSimlar = function (isClearSimlarOnly = false, self = this) {
                    // 類似文字リンクを削除
                    var parent = $('#' + self.inputDate.id + 'Similar').parent();
                    $('#' + self.inputDate.id + 'Similar').remove();
                    // 類似文字リンクの親Divに他の類似文字リンクがない場合、親Divも削除
                    parent.children().length == 0 && parent.remove();
                    if (isClearSimlarOnly) {
                        // 親ブロックの赤枠をクリア
                        var areaDiv = parent.parents('.input-check-area');
                        areaDiv.find('.err').length == 0 && areaDiv.removeClass('err');
                    }
                    else {
                        // エラーメッセージを削除(親ブロックの赤枠をクリアを含む)
                        AppBizCom.Msg.clearError(self.inputDate.errAreaId || self.inputDate.id);
                    }
                };
                /**
                 * 随時チェックを行う。
                 *
                 * @param {string} prop - チェックを実行のプロパティ(valChangChk、onBlurChk)
                 * @param {boolean} skipSimilarChk - 類似文字チェックスギップフラグ（）。デフォルト値：false
                 */
                this.anyTimeChk = function (prop, skipSimilarChk = false, self = this, isSimilarOnly = false) {
                    var chkObj = angular.copy(self.inputDate);
                    chkObj.val = self.model(self.$$scope);
                    // 前回の値と同じ場合、かつ入力値が空ではない場合、チェックを飛ばす
                    var preValue = self.preChkValue;
                    self.preChkValue = chkObj.val;
                    if (prop == "onBlurChk" && self.preChkValue === preValue && (self.preChkValue == undefined || self.preChkValue == '')) {
                        return;
                    }
                    // エラーメッセージと類似文字リックを削除
                    self.clearErrAndSimlar(false, self);
                    // 類似文字確定後再チェックの場合、類似文字チェックがチェック対象外ため、外す。
                    if (skipSimilarChk && chkObj[prop]) {
                        chkObj[prop].forEach((el, index) => {
                            chkObj[prop][index] = el.filter(val => val != 'hasSimilar');
                        });
                    }
                    else if (isSimilarOnly && chkObj[prop]) {
                        chkObj[prop] = [['hasSimilar']];
                    }
                    if (chkObj.val !== undefined && !AppBizCom.InputCheck.isEmpty(chkObj.val)) {
                        // 入力値がある場合
                        var result = AppLgcMultiCheck.inputCheck(chkObj, prop);
                        // 類似文字情報をレジスト
                        result[2] && this.registSimlarInfo(result[2], prop, self);
                    }
                };
                /**
                 * 類似文字情報をレジスト処理
                 *
                 * @param {object} chkResult - 類似文字チェック結果
                 * @param {string} prop - チェックを実行のプロパティ(valChangChk、onBlurChk)
                 */
                this.registSimlarInfo = (chkResult, prop, self = this) => {
                    // 画面項目ID、親IDと値更新する関数を登録する
                    var callback = function (newVal) {
                        self.model.assign(self.$$scope, newVal);
                        self.$$scope.$applyAsync();
                        self.anyTimeChk(prop, true, self);
                    };
                    // 類似文字情報を類似文字確認画面へ渡す
                    $scope.$emit('registSimlarInfo', {
                        id: chkResult.id,
                        name: self.inputDate.name,
                        chkList: chkResult.newResult,
                        parentI: chkResult.parentI,
                        childI: chkResult.childI,
                        pageID: self.pageID,
                        callback: callback
                    });
                };
            }
        };
    }]);
