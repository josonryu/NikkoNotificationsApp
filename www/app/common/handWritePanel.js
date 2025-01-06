/// <reference path='../reference.d.ts' />
var selfHwp = null;
class HandWritePanel {
    constructor(stringUtil) {
        this.isComposing = false; // 入力未確定状態フラグ
        this.isInputTouched = false; // false:タッチする要素が入力欄ではない true:タッチする要素が入力欄である
        this.touchedElement = undefined; // bodyのtouchstartイベントが発火時の対象DOM要素のid属性
        this.modeChanging = false; // 手書部品初期化状態フラグ
        this.keyboardHeightPlus = 0;
        this.currentType = '';
        this.attrDispName = 'data-dispName';
        this.attrMaxChar = 'maxlength';
        this.attrType = 'data-type';
        this.ignoreFlg = false;
        this.defaultMaxchar = 20;
        this.defaultFieldType = 'text';
        this.defaultRecognizeType = 'text_all';
        this.mailType = 'mail';
        this.hwSheetConf = {
            layout: {
                Data: {
                    "left": 0,
                    "top": 0,
                    "right": 90,
                    "bottom": 20,
                    "fieldType": this.defaultFieldType,
                    "recognizeType": this.defaultRecognizeType,
                    "maxChar": this.defaultMaxchar,
                    "halfChar": false
                }
            }
        };
        this.modalAssistant = $('#modal-assistant');
        this.modalKeyOverlay = $('.modal-key-overlay');
        this.dispTargetName = $('.dispTargetName');
        this.isRetryInit = false;
        // 認識文字の定義
        this.recog_string_list = [
            { kind: 1, begin: 0x2122, end: 0x2124 },
            { kind: 2, begin: 0x2125, end: 0x2125 },
            { kind: 3, begin: 0x2126, end: 0x2128 },
            { kind: 4, begin: 0x2129, end: 0x212A },
            { kind: 5, begin: 0x212B, end: 0x2131 },
            { kind: 6, begin: 0x2132, end: 0x2132 },
            { kind: 7, begin: 0x2133, end: 0x213B },
            { kind: 8, begin: 0x213C, end: 0x213C },
            { kind: 9, begin: 0x213E, end: 0x213E },
            { kind: 10, begin: 0x213F, end: 0x213F },
            { kind: 11, begin: 0x2140, end: 0x2140 },
            { kind: 12, begin: 0x2141, end: 0x2141 },
            { kind: 13, begin: 0x2142, end: 0x2142 },
            { kind: 14, begin: 0x2144, end: 0x215B },
            { kind: 15, begin: 0x215C, end: 0x215D },
            { kind: 16, begin: 0x215E, end: 0x2172 },
            { kind: 17, begin: 0x2173, end: 0x2173 },
            { kind: 18, begin: 0x2174, end: 0x2174 },
            { kind: 19, begin: 0x2175, end: 0x2175 },
            { kind: 20, begin: 0x2176, end: 0x227E },
            { kind: 21, begin: 0x2330, end: 0x2339 },
            { kind: 22, begin: 0x2341, end: 0x235A },
            { kind: 23, begin: 0x2361, end: 0x237A },
            { kind: 24, begin: 0x2421, end: 0x2473 },
            { kind: 25, begin: 0x2521, end: 0x256D },
            { kind: 26, begin: 0x256E, end: 0x256E },
            { kind: 27, begin: 0x256F, end: 0x256F },
            { kind: 28, begin: 0x2570, end: 0x2571 },
            { kind: 29, begin: 0x2572, end: 0x2574 },
            { kind: 30, begin: 0x2575, end: 0x2576 },
            { kind: 31, begin: 0x2621, end: 0x2628 },
            { kind: 32, begin: 0x262A, end: 0x276F },
            { kind: 33, begin: 0x2D35, end: 0x2D3E },
            { kind: 34, begin: 0x2D62, end: 0x2D62 },
            { kind: 35, begin: 0x2D64, end: 0x2D64 },
            { kind: 36, begin: 0x2D6A, end: 0x2D6A },
            { kind: 37, begin: 0x2D7A, end: 0x2D7A },
            { kind: 38, begin: 0x3021, end: 0x4F53 },
            { kind: 39, begin: 0x5021, end: 0x7426 },
            { kind: 40, begin: 0x7921, end: 0x792C },
            { kind: 41, begin: 0x792E, end: 0x7C6E },
            { kind: 42, begin: 0x7C71, end: 0x7C7A },
            { kind: 43, begin: 0x7C7D, end: 0x7C7D },
            { kind: 44, begin: 0x7C7E, end: 0x7C7E },
        ];
        // 認識タイプの定義
        this.recog_types = {
            // すべての全角文字種
            text_all: {
                categories: [
                    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                    21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
                    31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                    41, 42, 43, 44
                ]
            },
            // 全角カタカナ
            text_kana: {
                categories: [
                    8, 9, 21, 25, 27, 29
                ]
            },
            // メール用入力文字
            mail: {
                categories: [
                    2, 4, 6, 10, 12, 15, 17, 19, 21, 22, 23
                ] // メール用全角文字コード定義
            }
        };
        // 直接入力ボタン用半角to全角変換定義
        this.fullCharDef = {
            '1': '１',
            '2': '２',
            '3': '３',
            '4': '４',
            '5': '５',
            '6': '６',
            '7': '７',
            '8': '８',
            '9': '９',
            '0': '０',
            '-': '‐',
            'ｰ': 'ー'
        };
        // 直接入力ボタン用半角to全角変換定義
        this.modeDef = {
            handwite: { onCls: 'handwriteMode', offCls: 'keyboardMode', readonly: true },
            keyboard: { onCls: 'keyboardMode', offCls: 'handwriteMode', readonly: false }
        };
        this.deviceHeight = window.screen.height; // 端末の物理高さ
        selfHwp = this;
        selfHwp.stringUtil = stringUtil;
        selfHwp.screenIDMap = {};
        this._registManualKeyEvents();
        // this._initPluginOnce();
    }
    // Plugin初回起動失敗を防止するために、インスタンス生成時のみ一回初期化する。
    _initPluginOnce() {
        // 透明表示用クラス追加
        selfHwp.modalAssistant.addClass('transForInit');
        // 入力エリア表示（表示しないと初期化できないため）
        selfHwp.modalAssistant.show();
        selfHwp.hwSheetDivElement = document.getElementById('areaHandWriteInput');
        selfHwp.backgroundImageElement = new Image(selfHwp.hwSheetDivElement.clientWidth, selfHwp.hwSheetDivElement.clientHeight);
        selfHwp.backgroundImageElement.src = 'images/handwritepad.png';
        // 入力エリア非表示
        selfHwp.modalAssistant.hide();
        // 透明表示用クラス削除
        selfHwp.modalAssistant.removeClass('transForInit');
    }
    // 手書き部品イベント登録
    _registManualKeyEvents() {
        // 数字ボタン
        for (var i = 0; i < 10; i++) {
            document.getElementById('btnComHwpNumInput' + i).ontouchstart = selfHwp._inputValue;
        }
        // 'ﾊｲﾌﾝ'ボタン
        document.getElementById('btnComHwpInputHyphen').ontouchstart = selfHwp._inputValue;
        // 長音ボタン
        document.getElementById('btnComHwpInputVowel').ontouchstart = selfHwp._inputValue;
        // 一文字削除ボタン
        document.getElementById('btnComHwpOneCharDelete').ontouchstart = selfHwp._del1;
        // 全削除ボタン
        document.getElementById('btnComHwpAllCharDelete').ontouchstart = selfHwp._delAll;
        // 手書きへ切替ボタン
        document.getElementById('tabHandWriteMode').ontouchstart = selfHwp._changeToHandwrite;
        // キーボードへ切替ボタン
        document.getElementById('tabKeyboardMode').ontouchstart = selfHwp._changeToKeyboard;
        // キーボード閉じるボタン
        document.getElementById('btnComHwpClose').ontouchstart = selfHwp._closeKeyboard;
        // 手書き戻るボタン
        document.getElementById('btnComHwpBack').ontouchstart = selfHwp._closeAssisNoSave;
        // 手書き確定ボタン
        document.getElementById('btnComHwpEnter').ontouchstart = selfHwp._closeAssisSave;
        selfHwp.modalAssistant.off('mousedown').on('mousedown', selfHwp._hwpMousedownHandler);
        // Height変更イベント
        window.removeEventListener('native.keyboardshow', selfHwp._keyboardShowHandler);
        window.addEventListener('native.keyboardshow', selfHwp._keyboardShowHandler);
        // キーボード閉じるイベント
        window.removeEventListener('native.keyboardhide', selfHwp._keyboardHideHandler);
        window.addEventListener('native.keyboardhide', selfHwp._keyboardHideHandler);
        // TouchMoveイベント
        selfHwp.modalKeyOverlay.off('touchstart').on('touchstart', selfHwp._touchMoveEvnetHandler);
        selfHwp.modalAssistant.off('touchstart').on('touchstart', selfHwp._touchMoveEvnetHandler);
    }
    // 対象入力項目初期化
    init(targetsDef, logObj) {
        if (!targetsDef) {
            // 定義が存在しない場合は何もしない
            return;
        }
        selfHwp.logger = logObj;
        for (var index in targetsDef) {
            // 手書き対象項目取得
            var id = targetsDef[index].id;
            var name = targetsDef[index].name;
            var type = targetsDef[index].type;
            // 定義チェック、手書き対象項目element取得
            var target = selfHwp._checkDef(type, id, name);
            // 表示名設定
            target.setAttribute(selfHwp.attrDispName, name);
            // 入力タイプ設定
            target.setAttribute(selfHwp.attrType, type);
            // mailの場合フォーカス取得する前にreadonly解除
            target.onfocus = selfHwp._focusInHandler;
            target.onblur = selfHwp._focusOutHandler;
            selfHwp.screenIDMap[id] = selfHwp.logger.screenId;
        }
        cordova.plugins.Keyboard.disableScroll(true);
        selfHwp.scrollArea = document.getElementsByClassName('scrollArea')[0];
        $(selfHwp.scrollArea).addClass('main-div-area-scroll');
    }
    deinit(id) {
        // 画面IDを削除
        delete selfHwp.screenIDMap[id];
    }
    // 部品を初期化する。
    _initHandWrite() {
        if (selfHwp.currentElement == null) {
            return;
        }
        selfHwp._consoleLog('_initHandWrite start');
        selfHwp.modeChanging = true;
        $(selfHwp.hwSheetDivElement).empty();
        // 手書き文字認識エンジンの初期化
        $('body').off('touchstart').on('touchstart', (e) => {
            if (selfHwp.modeChanging) {
                return;
            }
            selfHwp.isInputTouched = e.target.getAttribute(selfHwp.attrType) != null;
            var tarId = e.target.getAttribute('id');
            selfHwp.touchedElement = tarId;
            console.log(e.target);
            selfHwp._consoleLog('target end');
            var tmpTar = $(e.target).parents('#modal-assistant');
            if (tmpTar.length == 1) {
                return;
            }
            if (selfHwp.currentElement == null) {
                return;
            }
            if (tarId == selfHwp.currentElement.id) {
                return;
            }
            selfHwp.isInputTouched && document.activeElement.blur();
            console.log(document.activeElement);
            selfHwp._consoleLog('activeElement end');
        });
        $(selfHwp.currentElement).off('compositionstart').on('compositionstart', function (e) {
            selfHwp._consoleLog('compositionstart（' + selfHwp.currentElement.dataset.dispname + '）');
            selfHwp.isComposing = true;
        });
        $(selfHwp.currentElement).off('compositionend').on('compositionend', function (e) {
            selfHwp._consoleLog('compositionend（' + selfHwp.currentElement.dataset.dispname + '）');
            selfHwp.isComposing = false;
            $(selfHwp.currentElement).triggerHandler('change'); // wk環境で、この1行がないと、閉じるボタン押下時にkeyboard閉じられない
            return selfHwp.currentElement.value;
        });
        // HWSheet.Engine.init(function () {
        //     //メールモードだったら、認識タイプを設定
        //     selfHwp.currentType = selfHwp.currentElement.getAttribute(selfHwp.attrType);
        //     if (selfHwp.currentType == selfHwp.mailType) {
        //         selfHwp.hwSheetConf.layout.Data.recognizeType = selfHwp.mailType;
        //         selfHwp.hwSheetConf.layout.Data.halfChar = true;
        //     }
        //     else {
        //         selfHwp.hwSheetConf.layout.Data.recognizeType = selfHwp.currentType;
        //         selfHwp.hwSheetConf.layout.Data.halfChar = false;
        //     }
        //     //手書き帳票ライブラリの初期化
        //     var hw = new HWSheet(selfHwp.hwSheetDivElement, selfHwp.backgroundImageElement, selfHwp.hwSheetConf);
        //     hw.setProperty({ viewportAction: { enable: false }, field: { backgroundColor: 'white' } });
        //     selfHwp.hwScope = hw.getFieldById('Data');
        //     $(window).off('resize').on('resize', function () {
        //         hw.resize();
        //     });
        //     selfHwp.isRetryInit = false;
        //     selfHwp.modeChanging = false;
        //     selfHwp._consoleLog('_initHandWrite end');
        // }, error, selfHwp.recog_string_list, selfHwp.recog_types);
        function error(err) {
            console.log(err);
        }
    }
    // 手書き表示エリアに値設定する。
    _setDataToField(data) {
        selfHwp._consoleLog('_setDataToField');
        selfHwp.hwScope && selfHwp.hwScope.setValueNoValidation(selfHwp._rejectOverflowData(data));
    }
    // 画面項目の最大桁数を超える文字(lengthプロパティの値)を削除する。
    _rejectOverflowData(data) {
        selfHwp._consoleLog('_rejectOverflowData');
        if (data.length > selfHwp.hwSheetConf.layout.Data.maxChar) {
            data = selfHwp._rejectOverflowData(selfHwp.stringUtil.delOneCharacter(data));
        }
        return data;
    }
    // 手書き表示エリアの値を取得する。
    _getDataFromField() {
        selfHwp._consoleLog('_getDataFromField');
        return selfHwp.hwScope ? selfHwp.hwScope.getValue() : '';
    }
    // 手書き表示パネルを表示する。
    _showAssisArea(isInputToInput = false) {
        selfHwp._consoleLog('_showAssisArea start');
        $(selfHwp.scrollArea).addClass('handwrite-pdb');
        $(selfHwp.currentElement).addClass('onfocus');
        // メールの場合、最大48文字が表示できるため、'mailType' クラスを追加
        if (selfHwp.currentType == selfHwp.mailType) {
            $("#areaHandWriteInput").addClass('mailType');
        }
        else {
            $("#areaHandWriteInput").removeClass('mailType');
        }
        var name = selfHwp.currentElement.getAttribute(selfHwp.attrDispName);
        var maxchar = selfHwp.currentElement.getAttribute(selfHwp.attrMaxChar);
        var type = selfHwp.currentElement.getAttribute(selfHwp.attrType);
        selfHwp.dispTargetName.text(name);
        // 入力項目名の桁数によって、フォントサイズを変更
        if (name.length > 10 && name.length < 20) {
            // １１文字～１９文字の場合 20px
            $("#lblKeyboardInputDescript").css("font-size", "20px");
            $("#lblHandWriteInputDescript").css("font-size", "20px");
        }
        else if (name.length <= 10) {
            // １０文字以下の場合、 26px（ディフォルト）
            $("#lblKeyboardInputDescript").css("font-size", '');
            $("#lblHandWriteInputDescript").css("font-size", '');
        }
        else {
            // ２０文字以上の場合、 15px
            $("#lblKeyboardInputDescript").css("font-size", "15px");
            $("#lblHandWriteInputDescript").css("font-size", "15px");
        }
        var mode = selfHwp.modeDef.keyboard;
        selfHwp._setMode(mode);
        // 手書き項目　⇒　手書き項目の場合、手書き表示パネルを再表示しない
        if (!isInputToInput) {
            // オーバーレイをフェードイン
            $('.handwriteBox_titleRow').addClass('transForInit');
            $('.handwriteBox_startLine').addClass('transForInit');
            $('.handwriteBox_showArea').addClass('transForInit');
            selfHwp.modalKeyOverlay.fadeIn(500, () => {
                $('.handwriteBox_titleRow').removeClass('transForInit');
                $('.handwriteBox_startLine').removeClass('transForInit');
                $('.handwriteBox_showArea').removeClass('transForInit');
            });
            // モーダルコンテンツフェードイン
            // selfHwp.modalAssistant.fadeIn(500);
        }
        var ModeName = mode == selfHwp.modeDef.handwite ? '手書き' : 'キーボード';
        selfHwp._writeLog(1, '入力補助画面(' + ModeName + ')表示:' + name);
        // 入力エリア初期化
        selfHwp._initHandWrite();
        selfHwp.hwSheetConf.layout.Data.maxChar = +maxchar;
        selfHwp.hwSheetConf.layout.Data.type = type;
        $(selfHwp.scrollArea).addClass('assisMode');
        var rect = selfHwp.currentElement.getBoundingClientRect();
        if (rect.top + rect.height > 250) {
            selfHwp.scrollArea.scrollTop = selfHwp.scrollArea.scrollTop + rect.top - 180;
        }
        selfHwp._consoleLog('_showAssisArea end');
    }
    // 手書き表示パネルを非表示する。
    _closeAssisArea(isInputToInput = false) {
        selfHwp._consoleLog('_closeAssisArea');
        !selfHwp.isInputTouched && $(selfHwp.scrollArea).removeClass('handwrite-pdb');
        $(selfHwp.currentElement).removeClass('onfocus');
        $(selfHwp.currentElement).off('compositionstart');
        $(selfHwp.currentElement).off('compositionend');
        $('body').off('touchstart');
        // 手書き項目　⇒　手書き項目の場合、手書き表示パネルを非表示しない
        if (!isInputToInput) {
            // モーダルコンテンツとオーバーレイをフェードアウト
            selfHwp.modalKeyOverlay.fadeOut(100);
            $('.handwriteBox_titleRow').addClass('transForInit');
            $('.handwriteBox_startLine').addClass('transForInit');
            $('.handwriteBox_showArea').addClass('transForInit');
            selfHwp.modalAssistant.fadeOut(100, () => {
                $('.handwriteBox_titleRow').removeClass('transForInit');
                $('.handwriteBox_startLine').removeClass('transForInit');
                $('.handwriteBox_showArea').removeClass('transForInit');
            });
        }
        selfHwp._writeLog(3, '入力補助画面非表示');
        return false;
    }
    // 入力内容を確定させ、手書き表示パネルを非表示する。
    _closeAssisNoSave() {
        if (selfHwp.currentElement == null) {
            return;
        }
        selfHwp._consoleLog('_closeAssisNoSave');
        $(selfHwp.scrollArea).removeClass('handwrite-pdb');
        selfHwp._writeLog(3, 'ボタンタップ：戻る');
        selfHwp.currentElement.blur();
        return false;
    }
    // 入力内容を確定させ、手書き表示パネルを非表示する。
    _closeAssisSave() {
        if (selfHwp.currentElement == null) {
            return;
        }
        selfHwp._consoleLog('_closeAssisSave');
        $(selfHwp.scrollArea).removeClass('handwrite-pdb');
        selfHwp._writeLog(3, 'ボタンタップ：確定');
        selfHwp._getHandwriteValue();
        selfHwp.currentElement.blur();
        return false;
    }
    // キーボードを非表示する。
    _closeKeyboard() {
        if (selfHwp.currentElement == null) {
            return;
        }
        selfHwp._consoleLog('_closeKeyboard');
        $(selfHwp.scrollArea).removeClass('handwrite-pdb');
        selfHwp._writeLog(3, 'ボタンタップ：閉じる');
        cordova.plugins.Keyboard.close();
        return false;
    }
    // 手書きタブへ切替する。
    _changeToHandwrite() {
        if (selfHwp.modeChanging) {
            return;
        }
        if (selfHwp.currentElement == null) {
            return;
        }
        if (selfHwp.modalAssistant.hasClass(selfHwp.modeDef.handwite.onCls)) {
            return false;
        }
        // キーボード入力で、未確定文字がある場合、changeイベントを発火する
        if (selfHwp.isComposing) {
            $(selfHwp.currentElement).triggerHandler('change');
        }
        selfHwp._consoleLog('_changeToHandwrite');
        selfHwp._setHandwriteValue();
        selfHwp._setMode(selfHwp.modeDef.handwite);
        selfHwp.ignoreFlg = true;
        selfHwp.currentElement.blur();
        selfHwp._setCurrentItemReadonly(true);
        selfHwp.currentElement.focus();
        selfHwp.ignoreFlg = false;
        selfHwp._writeLog(2, 'ボタンタップ：手書きモード(' + selfHwp.currentType + ')');
        return false;
    }
    // キーボードタブへ切替する。
    _changeToKeyboard() {
        if (selfHwp.modeChanging) {
            return;
        }
        if (selfHwp.currentElement == null) {
            return;
        }
        if (selfHwp.modalAssistant.hasClass(selfHwp.modeDef.keyboard.onCls)) {
            return false;
        }
        selfHwp._consoleLog('_changeToKeyboard');
        selfHwp._setMode(selfHwp.modeDef.keyboard);
        selfHwp.ignoreFlg = true;
        selfHwp.currentElement.blur();
        selfHwp._setCurrentItemReadonly(false);
        selfHwp._getHandwriteValue();
        selfHwp._delAll();
        selfHwp.currentElement.focus();
        selfHwp.ignoreFlg = false;
        selfHwp._writeLog(2, 'ボタンタップ：キーボードモード');
        return false;
    }
    // 表示モードを設定する。
    _setMode(mode) {
        selfHwp._consoleLog('_setMode');
        selfHwp.modalAssistant.removeClass(mode.offCls);
        selfHwp.modalAssistant.addClass(mode.onCls);
    }
    // 入力項目のフォーカス取得イベント処理する。
    _focusInHandler(focusEvent) {
        if (selfHwp.ignoreFlg) {
            return;
        }
        if (selfHwp.currentElement
            && selfHwp.currentElement == focusEvent.target
            && selfHwp.currentElement == document.activeElement) {
            return;
        }
        selfHwp._consoleLog('_focusInHandler');
        selfHwp.currentElement = focusEvent.target;
        selfHwp.currentType = selfHwp.currentElement.getAttribute(selfHwp.attrType);
        var isInputToInput = focusEvent.relatedTarget && focusEvent.relatedTarget.getAttribute(selfHwp.attrType) != null;
        selfHwp._showAssisArea(isInputToInput);
    }
    // 入力項目のフォーカス喪失イベント処理する。
    _focusOutHandler(focusEvent) {
        if (selfHwp.ignoreFlg) {
            return;
        }
        if (selfHwp.currentElement == null) {
            return;
        }
        // キーボード入力で、未確定文字がある場合、focusOutイベントを発火しない
        if (selfHwp.isComposing) {
            return;
        }
        selfHwp._consoleLog('_focusOutHandler');
        var isInputToInput = focusEvent.relatedTarget && focusEvent.relatedTarget.getAttribute(selfHwp.attrType) != null;
        selfHwp._closeAssisArea(isInputToInput);
        selfHwp._setCurrentItemReadonly(false);
        selfHwp.currentElement = null;
        selfHwp.currentType = '';
        // 入力項目のフォーカス喪失イベントが事項しても、入力項目の「:focus」が残ってしまう対応
        focusEvent.target.blur();
    }
    // 手書きパネルのフォーカス取得を抑止するためmousedownイベントを廃棄。
    _hwpMousedownHandler(mousedownEvent) {
        selfHwp._consoleLog('_hwpMousedownHandler');
        mousedownEvent.preventDefault();
    }
    // 画面中の項目値を手書き表示エリアに設定。
    _setHandwriteValue() {
        if (selfHwp.currentElement == null) {
            return;
        }
        selfHwp._consoleLog('_setHandwriteValue');
        var fieldData = selfHwp.currentElement.value;
        selfHwp._setDataToField(fieldData);
    }
    // 手書き表示エリア値を画面中の項目に設定。
    _getHandwriteValue() {
        if (selfHwp.currentElement == null) {
            return;
        }
        selfHwp._consoleLog('_getHandwriteValue');
        var fieldData = selfHwp._getDataFromField();
        selfHwp.currentElement.value = fieldData;
        // ngChangeイベントを発生させ
        angular.element(selfHwp.currentElement).triggerHandler('change');
        return fieldData;
    }
    // 手書き表示エリアの最後の一文字を削除。
    _del1() {
        var fieldData = selfHwp._getDataFromField();
        selfHwp._setDataToField(selfHwp.stringUtil.delOneCharacter(fieldData));
    }
    // 手書き表示エリアの全ての文字を削除。
    _delAll() {
        selfHwp._setDataToField('');
    }
    // 手書き表示エリアに指定文字を追加。 
    _inputValue(event) {
        selfHwp._consoleLog('_inputValue');
        var eValue = event.target.value;
        var fieldData = selfHwp._getDataFromField();
        if (selfHwp.hwSheetConf.layout.Data.type == 'mail') {
            selfHwp._setDataToField(fieldData + eValue);
        }
        else {
            selfHwp._setDataToField(fieldData + selfHwp._toFullChar(eValue));
        }
    }
    // ボタン入力用半角文字⇒全角文字変換。 
    _toFullChar(char) {
        var result = selfHwp.fullCharDef[char];
        return result == null ? '' : result;
    }
    // 指定項目の読み取り専用属性を設定する。
    _setItemReadonly(element, isReadOnly, defalutKeyboard) {
        if (!element) {
            return;
        }
        if (isReadOnly && !defalutKeyboard) {
            element.setAttribute('readonly', 'true');
        }
        else {
            element.removeAttribute('readonly');
        }
    }
    // 現在編集中の項目の読み取り専用属性を設定する。
    _setCurrentItemReadonly(isReadOnly) {
        selfHwp._setItemReadonly(selfHwp.currentElement, isReadOnly);
    }
    // 手書き定義属性チェック
    _checkDef(type, id, name) {
        if (id && name && type) {
            if (!selfHwp.recog_types[type]) {
                // 定義内容が不正の場合例外をスロー(共通エラー処理へ)
                throw '手書き入力項目:' + id + 'のType:' + type + 'が使用できません。';
            }
            var target = document.getElementById(id);
            if (target) {
                return target;
            }
            // 定義内容が不正の場合例外をスロー(共通エラー処理へ)
            throw '手書き入力項目定義id:' + id + 'が画面に存在しません。';
        }
        else {
            // 定義内容が不正の場合例外をスロー(共通エラー処理へ)
            throw '手書き入力項目属性エラー:id=/' + id + '/, name=/' + name + '/, type=/' + type + '/';
        }
    }
    // log出力
    _writeLog(type, msg, lvl) {
        var comLog = selfHwp.logger['AppComLog'];
        var userId = selfHwp.logger['userId'];
        var miseiCode = selfHwp.logger['miseiCode'];
        var kakariCode = selfHwp.logger['kakariCode'];
        var id = selfHwp.currentElement.getAttribute('id');
        var screenId = selfHwp.screenIDMap[id] || selfHwp.logger['screenId'];
        var level = lvl ? lvl : 'I';
        var pageId = 'G1510-01';
        var msgContent;
        switch (type) {
            case 1:
                msgContent = screenId + ' > ' + pageId + ' ' + msg;
                break;
            case 2:
                msgContent = pageId + ' > ' + pageId + ' ' + msg;
                break;
            case 3:
                msgContent = pageId + ' > ' + screenId + ' ' + msg;
                break;
            default:
                msgContent = pageId + ' ' + msg;
                break;
        }
        comLog.writeLog(userId, miseiCode, kakariCode, level, msgContent, '');
    }
    _consoleLog(msg, param) {
        if (selfHwp.logger == null) {
            return;
        }
        var comLog = selfHwp.logger['AppComLog'];
        comLog.consoleLog('handWritePanel.js', msg, param);
    }
    // キーボードShowEvnet（キーボード出る時、毎回更新）
    _keyboardShowHandler(e) {
        selfHwp._consoleLog('_keyboardShowHandler');
        // 手書き表示パネルの高さを調整する
        var height = e.keyboardHeight / selfHwp.deviceHeight * 1024;
        $('.handwriteBox').css('height', (height - 39 - 44) + 'px');
        $('#areaHandWriteInput').css('height', (height - 65 - 39 - 44) + 'px');
        selfHwp.modalKeyOverlay.css('height', (60 + height) + 'px');
        selfHwp.modalAssistant.css('height', (100 + height) + 'px');
        selfHwp.modalAssistant.css('padding-top', '0.5px');
    }
    _keyboardHideHandler(e) {
        if (selfHwp.currentElement == null) {
            return;
        }
        selfHwp._consoleLog('_keyboardHideHandler');
        // 手書きモードへ変更する場合
        if (selfHwp.modalAssistant.hasClass(selfHwp.modeDef.handwite.onCls) && selfHwp.currentElement.value != "") {
            // 手書きエリアの描画をする前に、inputData.jsの全角・半角変換処理が速く発生した。再描画のため、keyboardを閉じる時点でもう一回描画を実施する
            selfHwp._setHandwriteValue();
            // 未確定文字が対象項目のmaxlengthを超過しないため、手書きエリアの入力値をHTMLに設定する
            selfHwp._getHandwriteValue();
        }
        if (selfHwp.modalAssistant.hasClass(selfHwp.modeDef.handwite.onCls) && selfHwp.currentElement.value == "") {
            // 未確定文字が対象項目のmaxlengthを超過する場合、HTMLのレンダリングができなくなるかもしれないので、手書きエリアの入力値をHTMLに設定する
            selfHwp._getHandwriteValue();
        }
        // OSキーボードの閉じるアイコン、または手書き部品範囲外の画面をタップ時、アクティブ項目にて、focusが残った件の対応
        if (selfHwp.touchedElement != 'tabHandWriteMode' && selfHwp.touchedElement != 'signModeIcon') {
            selfHwp.touchedElement = undefined;
            document.activeElement.blur();
        }
        // キーボードモードかつ入力中項目が存在する場合（OSキーボード入力未確定文字の状態で、ラジオボタン、リンクなどのDOM要素をタップする場合）、手書き表示パネルを閉じる
        if (selfHwp.currentElement && selfHwp.modalAssistant.hasClass(selfHwp.modeDef.keyboard.onCls)) {
            selfHwp._closeAssisArea();
            selfHwp._setCurrentItemReadonly(false);
            // 入力中項目のHTMLのvalueをクリアする（angularモジュールの入力値クリア処理は各画面実装）
            $("#" + selfHwp.currentElement.id).val('');
            selfHwp.currentElement = null;
            selfHwp.currentType = '';
            selfHwp.isComposing = false;
        }
    }
    // 手書きエリアのTouchMoveイベント
    // 手書きエリアがMainDivをスクロールされないため
    _touchMoveEvnetHandler(e) {
        e.target.className.indexOf('hw-sheet-main-canvas') < 0 && e.preventDefault();
    }
}
