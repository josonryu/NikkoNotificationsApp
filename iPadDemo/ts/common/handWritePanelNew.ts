/// <reference path='../reference.d.ts' />
declare var $: JQueryStatic;
declare var HWSheet: any;
declare var angular: any;
var selfHwp: any = null;
class HandWritePanelNew {
    hwScope: any;
    hwSheetDivElement: any;
    backgroundImageElement: any;
    currentType: string = '';
    attrDispName: string ='data-dispName';
    attrMaxChar: string ='maxlength';
    attrType: string ='data-type';
    defaultMaxchar: number = 20;
    defaultFieldType: string = 'text';
    defaultRecognizeType: string = 'text_all';
    mailType: string = 'mail';
    hwSheetConf: any = {
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
    modalAssistant: any = $('#modal-assistant');
    modalKeyOverlay: any = $('.modal-key-overlay');
    dispTargetName: any = $('.dispTargetName');

    currentElement: any;
    scrollArea: any;
    logger: any;
    // 認識文字の定義
    recog_string_list: any = [
        { kind: 1, begin: 0x2122, end: 0x2124 }, // 全角記号１
        { kind: 2, begin: 0x2125, end: 0x2125 }, // 全角記号２
        { kind: 3, begin: 0x2126, end: 0x2128 }, // 全角記号３
        { kind: 4, begin: 0x2129, end: 0x212A }, // 全角記号４
        { kind: 5, begin: 0x212B, end: 0x2131 }, // 全角記号５
        { kind: 6, begin: 0x2132, end: 0x2132 }, // 全角記号６
        { kind: 7, begin: 0x2133, end: 0x213B }, // 全角記号７
        { kind: 8, begin: 0x213C, end: 0x213C }, // 全角記号８
        { kind: 9, begin: 0x213E, end: 0x213E }, // 全角記号９
        { kind: 10, begin: 0x213F, end: 0x213F }, // 全角記号１０
        { kind: 11, begin: 0x2140, end: 0x2140 }, // 全角記号１１
        { kind: 12, begin: 0x2141, end: 0x2141 }, // 全角記号１２
        { kind: 13, begin: 0x2142, end: 0x2142 }, // 全角記号１３
        { kind: 14, begin: 0x2144, end: 0x215B }, // 全角記号１４
        { kind: 15, begin: 0x215C, end: 0x215D }, // 全角記号１５
        { kind: 16, begin: 0x215E, end: 0x2172 }, // 全角記号１６
        { kind: 17, begin: 0x2173, end: 0x2173 }, // 全角記号１７
        { kind: 18, begin: 0x2174, end: 0x2174 }, // 全角記号１８
        { kind: 19, begin: 0x2175, end: 0x2175 }, // 全角記号１９
        { kind: 20, begin: 0x2176, end: 0x227E }, // 全角記号２０
        { kind: 21, begin: 0x2330, end: 0x2339 }, // 全角数字
        { kind: 22, begin: 0x2341, end: 0x235A }, // 全角英字（大文字）
        { kind: 23, begin: 0x2361, end: 0x237A }, // 全角英字（小文字）
        { kind: 24, begin: 0x2421, end: 0x2473 }, // ひらがな
        { kind: 25, begin: 0x2521, end: 0x256D }, // 全角カタカナ１
        { kind: 26, begin: 0x256E, end: 0x256E }, // 全角カタカナ２
        { kind: 27, begin: 0x256F, end: 0x256F }, // 全角カタカナ３
        { kind: 28, begin: 0x2570, end: 0x2571 }, // 全角カタカナ４
        { kind: 29, begin: 0x2572, end: 0x2574 }, // 全角カタカナ５
        { kind: 30, begin: 0x2575, end: 0x2576 }, // 全角カタカナ６
        { kind: 31, begin: 0x2621, end: 0x2628 }, // 全角記号２１
        { kind: 32, begin: 0x262A, end: 0x276F }, // 全角記号２２
        { kind: 33, begin: 0x2D35, end: 0x2D3E }, // 全角記号（IBM拡張文字）１
        { kind: 34, begin: 0x2D62, end: 0x2D62 }, // 全角記号（IBM拡張文字）２
        { kind: 35, begin: 0x2D64, end: 0x2D64 }, // 全角記号（IBM拡張文字）３
        { kind: 36, begin: 0x2D6A, end: 0x2D6A }, // 全角記号（IBM拡張文字）４
        { kind: 37, begin: 0x2D7A, end: 0x2D7A }, // 全角記号（IBM拡張文字）５
        { kind: 38, begin: 0x3021, end: 0x4F53 }, // 漢字（JIS第一水準）
        { kind: 39, begin: 0x5021, end: 0x7426 }, // 漢字（JIS第二水準）
        { kind: 40, begin: 0x7921, end: 0x792C }, // 漢字（IBM拡張文字）１
        { kind: 41, begin: 0x792E, end: 0x7C6E }, // 漢字（IBM拡張文字）２
        { kind: 42, begin: 0x7C71, end: 0x7C7A }, // 全角記号（IBM拡張文字）６
        { kind: 43, begin: 0x7C7D, end: 0x7C7D }, // 全角記号（IBM拡張文字）７
        { kind: 44, begin: 0x7C7E, end: 0x7C7E }, // 全角記号（IBM拡張文字）８
    ];
    // 認識タイプの定義
    recog_types: any = {
        // すべての全角文字種
        text_all: {
            categories: [
                1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 
                11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
                21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
                31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
                41, 42, 43, 44 ]
        },
        // 全角カタカナ
        text_kana: {
            categories: [
                8,  9,  21, 25, 27, 29 ]
        },
        // メール用入力文字
        mail: {
            categories: [
                2, 4, 6, 10, 12, 15, 17, 19, 21, 22, 23 ] // メール用全角文字コード定義
        }
    };
    // 直接入力ボタン用半角to全角変換定義
    fullCharDef: any = {
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
    }
    // 直接入力ボタン用半角to全角変換定義
    modeDef: any = {
        handwite: {onCls: 'handwriteMode', offCls: 'keyboardMode', readonly: true},
        keyboard: {onCls: 'keyboardMode', offCls: 'handwriteMode', readonly: false}
    }
    stringUtil: any;
    screenIDMap: any;

    deviceHeight: number = window.screen.height; // 端末の物理高さ
    isHandMode: boolean = false; // 手書きモード区分
    isCloseKeyboard: boolean = false; // OSキーボード閉じる状態フラグ
    tmpCloseElement: any = undefined; // OSキーボード閉じる中の対象要素
    isOpenHandMode: boolean = false; // モード切り替え時のフラグ
    isComposing: boolean = false; // 未確定文字フラグ

    constructor(stringUtil) {
        selfHwp = this;
        selfHwp.stringUtil = stringUtil;
        selfHwp.screenIDMap = {};
        this._registManualKeyEvents();
        this._initPluginOnce();
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

        // キーボード開くイベント
        window.removeEventListener('native.keyboardshow', selfHwp._keyboardShowHandler);
        window.addEventListener('native.keyboardshow', selfHwp._keyboardShowHandler);
        // キーボード閉じるイベント
        window.removeEventListener('native.keyboardhide', selfHwp._keyboardHideHandler);
        window.addEventListener('native.keyboardhide', selfHwp._keyboardHideHandler);
        // TouchMoveイベント
        selfHwp.modalKeyOverlay.off('touchmove').on('touchmove', selfHwp._touchMoveEvnetHandler);
        selfHwp.modalAssistant.off('touchmove').on('touchmove', selfHwp._touchMoveEvnetHandler);

        // ジェスチャー操作イベント
        window.removeEventListener('gesturestart', selfHwp._gestureEventHandler);
        window.addEventListener('gesturestart', selfHwp._gestureEventHandler);
        window.removeEventListener('gestureend', selfHwp._gestureEventHandler);
        window.addEventListener('gestureend', selfHwp._gestureEventHandler);
    }

    // 手書き製品を初期化する。
    _initHwEngine() {
        console.log('initHwEngineOnce');
        HWSheet.Engine.init(function () {
            console.log('success');
        }, error, selfHwp.recog_string_list, selfHwp.recog_types);
        function error(err) {
            console.log(err);
        }
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
        // 手書き製品を初期化する
        selfHwp._initHwEngine();
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
            var id: string = targetsDef[index].id;
            var name: string = targetsDef[index].name;
            var type: string = targetsDef[index].type;
            // 定義チェック、手書き対象項目element取得
            var target: any = selfHwp._checkDef(type, id, name);
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

    // 画面IDを削除する。
    deinit(id){
        delete selfHwp.screenIDMap[id];
    }

    // 部品を初期化する。
    _initHandWrite() {
        selfHwp._consoleLog('_initHandWrite start');
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if (selfHwp.currentElement == null) {
            selfHwp._consoleLog('_initHandWrite start return');
            return;
        }

        // タッチイベント処理
        $('body').off('touchend').on('touchend', (e) => {
            selfHwp._consoleLog('body touchend');
            var isInputTouched: boolean = e.target.getAttribute(selfHwp.attrType) != null;
            var tmpTar: any = $(e.target).parents('#modal-assistant');

            // ボタン要素について、フォーカス取得可能にする
            var isFocusChangeElem: boolean = e.target.tagName === 'BUTTON';
            if (tmpTar.length < 1 && selfHwp.currentElement && !isInputTouched && isFocusChangeElem) {
                selfHwp._closeAssisArea();
                // 未確定文字が存在しない場合、ボタンクリック処理を発火させ
                !selfHwp.isComposing && $(e.target).trigger('click');
                return false;
            }
            // 対象要素が手書きモーダル内ではない、かつ現時点の手書き要素が存在する、かつ入力要素ではない、かつ手書きモードではない場合、現時点の手書き要素に（もう一度）フォーカスする
            // ※手書き処理中に、手書き項目以外の画面要素をタップ時に、現時点の手書き要素のフォーカスがなくなって、OSキーボードも非表示になるため、もう一度現時点の手書き要素にフォーカスを取得する
            if (tmpTar.length < 1 && selfHwp.currentElement && !isInputTouched && !selfHwp.isOpenHandMode) {
                selfHwp._consoleLog('body touchend currentElement focus');
                selfHwp.currentElement.focus();
            }
            // 手書きモード、かつ対象要素が現時点の手書き要素の場合、または対象要素が入力要素ではない場合、処理を中止する
            if ((selfHwp.isOpenHandMode && e.target == selfHwp.currentElement) || !isInputTouched) {
                selfHwp._consoleLog('body touchend return');
                return false;
            }
        });
        // 文字入力開始イベント
        $(selfHwp.currentElement).off('compositionstart').on('compositionstart', function (e) {
            selfHwp.isComposing = true;
        });
        // 入力文字確定完了イベント
        $(selfHwp.currentElement).off('compositionend').on('compositionend', function (e) {
            selfHwp.isComposing = false;
        });

        // 手書きエリアのDOM要素を初期化する
        $(selfHwp.hwSheetDivElement).empty();
        // 最大桁数を設定
        var maxchar: any = selfHwp.currentElement.getAttribute(selfHwp.attrMaxChar);
        selfHwp.hwSheetConf.layout.Data.maxChar = +maxchar;
        // メールモードだったら、認識タイプを設定
        selfHwp.hwSheetConf.layout.Data.halfChar = selfHwp.currentType == selfHwp.mailType;
        selfHwp.hwSheetConf.layout.Data.recognizeType = selfHwp.currentType;
        //手書き帳票ライブラリの初期化
        var hw = new HWSheet(selfHwp.hwSheetDivElement, selfHwp.backgroundImageElement, selfHwp.hwSheetConf);
        hw.setProperty({viewportAction :{enable: false}, field :{backgroundColor: 'white'}});
        selfHwp.hwScope = hw.getFieldById('Data');
        $(window).off('resize').on('resize', function () {
            hw.resize();
        });

        // 手書きモードへ切り替える場合、入力値を手書き表示エリアに反映させる
        selfHwp.isOpenHandMode && selfHwp._setHandwriteValue();
        selfHwp.isOpenHandMode = false;
        selfHwp._consoleLog('_initHandWrite end');
    }
    
    // 手書き表示パネルを表示する。
    _showAssisArea() {
        selfHwp._consoleLog('_showAssisArea start');
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if(selfHwp.currentElement == null) {
            selfHwp._consoleLog('_showAssisArea return');
            return;
        }

        selfHwp.isHandMode = false; // ディフォルトはキーボードモード
        selfHwp._setMode(selfHwp.modeDef.keyboard);

        // 入力項目の赤枠を表示
        $(selfHwp.currentElement).addClass('onfocus');

        // メール項目の場合、最大48文字が表示できるため、'mailType' クラスを追加
        if (selfHwp.currentType == selfHwp.mailType) {
            $("#areaHandWriteInput").addClass('mailType');
        } else {
            $("#areaHandWriteInput").removeClass('mailType');
        }

        // 入力項目名を設定
        var name: string = selfHwp.currentElement.getAttribute(selfHwp.attrDispName);
        selfHwp.dispTargetName.text(name);
        selfHwp._writeLog(1, '入力補助画面(キーボード)表示:' + name);

        // 入力項目名の桁数によって、フォントサイズを変更
        if (name.length > 10 && name.length < 20) {
            // １１文字～１９文字の場合 20px
            $("#lblKeyboardInputDescript").css("font-size", "20px");
            $("#lblHandWriteInputDescript").css("font-size", "20px");
        } else if (name.length <= 10) {
            // １０文字以下の場合、 26px（ディフォルト）
            $("#lblKeyboardInputDescript").css("font-size", '');
            $("#lblHandWriteInputDescript").css("font-size", '');
        } else {
            // ２０文字以上の場合、 15px
            $("#lblKeyboardInputDescript").css("font-size", "15px");
            $("#lblHandWriteInputDescript").css("font-size", "15px");
        }

        // オーバーレイをフェードイン
        selfHwp.modalKeyOverlay.fadeIn(500);
        // モーダルコンテンツフェードイン
        $('.handwriteBox_titleRow').addClass('transForInit');
        $('.handwriteBox_startLine').addClass('transForInit');
        $('.handwriteBox_showArea').addClass('transForInit');
        selfHwp.modalAssistant.fadeIn(500,() => {
            $('.handwriteBox_titleRow').removeClass('transForInit');
            $('.handwriteBox_startLine').removeClass('transForInit');
            $('.handwriteBox_showArea').removeClass('transForInit');
        });

        // 入力項目の位置調整
        $(selfHwp.scrollArea).addClass('handwrite-pdb'); // スクロールエリアの下端に余白を追加
        var rect: any = selfHwp.currentElement.getBoundingClientRect();
        if(rect.top + rect.height > 250) {
            selfHwp.scrollArea.scrollTop = selfHwp.scrollArea.scrollTop + rect.top - 180;
        }

        // 入力エリア初期化
        selfHwp._initHandWrite();

        selfHwp._consoleLog('_showAssisArea end');
    }

    // 手書き表示パネルを非表示する。
    _closeAssisArea() {
        selfHwp._consoleLog('_closeAssisArea');
        // スクロールエリアの下端に余白を消す
        $(selfHwp.scrollArea).removeClass('handwrite-pdb');
        // 入力項目の赤枠を消す
        $(selfHwp.currentElement).removeClass('onfocus');
        // タッチイベントを廃止する
        $('body').off('touchend');

        // オーバーレイをフェードアウト
        selfHwp.modalKeyOverlay.fadeOut(100);
        // モーダルコンテンツフェードアウト
        $('.handwriteBox_titleRow').addClass('transForInit');
        $('.handwriteBox_startLine').addClass('transForInit');
        $('.handwriteBox_showArea').addClass('transForInit');
        selfHwp.modalAssistant.fadeOut(100, () => {
            $('.handwriteBox_titleRow').removeClass('transForInit');
            $('.handwriteBox_startLine').removeClass('transForInit');
            $('.handwriteBox_showArea').removeClass('transForInit');
        });

        cordova.plugins.Keyboard.close();
        // 手書きエリアのDOM要素を初期化する（OSキーボード閉じる中に、二本指を抑止するため）
        $(selfHwp.hwSheetDivElement).empty();
        // モード切り替え時のフラグを初期化
        selfHwp.isOpenHandMode = false;
        // フォーカス喪失処理
        selfHwp.currentType = '';
        if(selfHwp.currentElement){
            selfHwp._setCurrentItemReadonly(false);
            selfHwp.currentElement.blur();
            selfHwp.currentElement = null;
        }
        return false;
    }

    // 入力内容を確定させ、手書き表示パネルを非表示する。
    _closeAssisNoSave() {
        selfHwp._consoleLog('_closeAssisNoSave');
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if(selfHwp.currentElement == null) {
            selfHwp._consoleLog('_closeAssisNoSave return');
            return;
        }
        selfHwp._writeLog(3, 'ボタンタップ：戻る');
        selfHwp._closeAssisArea();
        return false;
    }

    // 入力内容を確定させ、手書き表示パネルを非表示する。
    _closeAssisSave() {
        selfHwp._consoleLog('_closeAssisSave');
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if(selfHwp.currentElement == null) {
            selfHwp._consoleLog('_closeAssisSave return');
            return;
        }
        selfHwp._writeLog(3, 'ボタンタップ：確定');
        selfHwp._getHandwriteValue();
        selfHwp._closeAssisArea();
        return false;
    }

    // キーボードを非表示する。
    _closeKeyboard() {
        selfHwp._consoleLog('_closeKeyboard');
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if(selfHwp.currentElement == null) {
            selfHwp._consoleLog('_closeKeyboard return');
            return;
        }
        selfHwp._writeLog(3, 'ボタンタップ：閉じる');
        selfHwp.isCloseKeyboard = true;
        selfHwp._closeAssisArea();
        setTimeout(function(){
            selfHwp.isCloseKeyboard = false;
            selfHwp.tmpCloseElement && selfHwp.tmpCloseElement.blur();
            selfHwp.tmpCloseElement = undefined;
        }, 100);
        return false;
    }

    // 手書きタブへ切替する。
    _changeToHandwrite() {
        selfHwp._consoleLog('_changeToHandwrite');
        // 現時点の手書き要素が存在していない、または既に手書きモードの場合、処理を中止する
        if (selfHwp.currentElement == null || selfHwp.isHandMode) {
            selfHwp._consoleLog('_changeToHandwrite return');
            return;
        }
        setTimeout(function(){
            selfHwp.isHandMode = true;
        }, 100);
        selfHwp.isOpenHandMode = true;
        selfHwp._setMode(selfHwp.modeDef.handwite);
        selfHwp._setCurrentItemReadonly(true);
        cordova.plugins.Keyboard.close();
        selfHwp._writeLog(2, 'ボタンタップ：手書きモード(' + selfHwp.currentType + ')');
        return false;
    }

    // キーボードタブへ切替する。
    _changeToKeyboard() {
        selfHwp._consoleLog('_changeToKeyboard');
        // 現時点の手書き要素が存在していない、または既にキーボードモードの場合、処理を中止する
        if (selfHwp.currentElement == null || !selfHwp.isHandMode) {
            selfHwp._consoleLog('_changeToKeyboard return');
            return;
        }
        setTimeout(function(){
            selfHwp.isHandMode = false;
        }, 100);
        selfHwp.isOpenHandMode = false;
        selfHwp._setMode(selfHwp.modeDef.keyboard);
        selfHwp._setCurrentItemReadonly(false);
        selfHwp._getHandwriteValue();
        selfHwp._delAll();
        selfHwp.currentElement.focus();
        selfHwp._writeLog(2, 'ボタンタップ：キーボードモード');
        return false;
    }

    // 表示モードを設定する。
    _setMode(mode) {
        selfHwp.modalAssistant.removeClass(mode.offCls);
        selfHwp.modalAssistant.addClass(mode.onCls);
    }

    // 入力項目のフォーカス取得イベント処理する。
    _focusInHandler(focusEvent) {
        selfHwp._consoleLog('_focusInHandler');
        // OSキーボード閉じる中の場合、フォーカス対象要素を一時退避する
        if (selfHwp.isCloseKeyboard) {
            selfHwp.tmpCloseElement = focusEvent.target;
            selfHwp._consoleLog('_focusInHandler isCloseKeyboard return');
            return;
        }
        // フォーカス取得対象要素が現時点の手書き要素の場合、処理を中止する
        if (selfHwp.currentElement == focusEvent.target) {
            selfHwp._consoleLog('_focusInHandler focusEvent target return');
            return;
        }
        if (selfHwp.currentElement
            && selfHwp.currentElement != focusEvent.target) {
            $(selfHwp.currentElement).removeClass('onfocus');
        }
        selfHwp._setCurrentItemReadonly(false);
        selfHwp.currentElement = focusEvent.target;
        selfHwp.currentType = selfHwp.currentElement.getAttribute(selfHwp.attrType);
    }

    // 入力項目のフォーカス喪失イベント処理する。
    _focusOutHandler(focusEvent) {
        selfHwp._consoleLog('_focusOutHandler');
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if(selfHwp.currentElement == null) {
            selfHwp._consoleLog('_focusOutHandler return');
            return;
        }
        // フォーカス喪失対象要素が現時点の手書き要素の場合、処理を中止する
        if (selfHwp.currentElement == focusEvent.target) {
            selfHwp._consoleLog('_focusInHandler focusEvent target return');
            return;
        }
        selfHwp._setCurrentItemReadonly(false);
        $(selfHwp.currentElement).removeClass('onfocus');
    }

    // キーボードShowEvnet（キーボード出る時、毎回更新）
    _keyboardShowHandler(e) {
        selfHwp._consoleLog('_keyboardShowHandler');
        // 手書き表示パネルの高さを調整する
        var height: number = e.keyboardHeight / selfHwp.deviceHeight * 1024;
        $('.handwriteBox').css('height', (height - 39 - 44) + 'px');
        $('#areaHandWriteInput').css('height', (height - 65 - 39 - 44) + 'px');
        selfHwp.modalKeyOverlay.css('height', (60 + height) + 'px');
        selfHwp.modalAssistant.css('height', (100 + height) + 'px');
        selfHwp.modalAssistant.css('padding-top', '0.5px');

        // 手書き表示パネルを表示する
        selfHwp._showAssisArea();
    }

    _keyboardHideHandler(e) {
        selfHwp._consoleLog('_keyboardHideHandler');
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if (selfHwp.currentElement == null) {
            selfHwp._consoleLog('_keyboardHideHandler return');
            return;
        }
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
        // キーボードモードの場合、手書き表示パネルを閉じる
        if (!selfHwp.isOpenHandMode) {
            selfHwp._closeAssisArea();
        }
    }

    // 手書きパネルのフォーカス取得を抑止するためmousedownイベントを廃棄。
    _hwpMousedownHandler(mousedownEvent) {
        selfHwp._consoleLog('_hwpMousedownHandler');
        mousedownEvent.preventDefault();
    }

    // ジェスチャー操作でフォーカス取得を抑止するためジェスチャーイベントを廃棄。
    _gestureEventHandler(gestureEvent) {
        selfHwp._consoleLog('_gestureEventHandler');
        gestureEvent.preventDefault();
    }

    // 手書きエリアのTouchMoveイベント
    // 手書きエリアがMainDivをスクロールされないため
    _touchMoveEvnetHandler(e){
        e.target.className.indexOf('hw-sheet-main-canvas') < 0 && e.preventDefault();
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

    // 画面中の項目値を手書き表示エリアに設定。
    _setHandwriteValue() {
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if(selfHwp.currentElement == null) {
            return;
        }
        var fieldData: any = selfHwp.currentElement.value;
        selfHwp._setDataToField(fieldData);
    }

    // 手書き表示エリア値を画面中の項目に設定。
    _getHandwriteValue() {
        // 現時点の手書き要素が存在していない場合、処理を中止する
        if(selfHwp.currentElement == null) {
            return;
        }
        var fieldData: any = selfHwp._getDataFromField();
        selfHwp.currentElement.value = fieldData;
        // ngChangeイベントを発生させ
        angular.element(selfHwp.currentElement).triggerHandler('change');

        return fieldData;
    }

    // 手書き表示エリアの最後の一文字を削除。
    _del1() {
        var fieldData: any = selfHwp._getDataFromField();
        selfHwp._setDataToField(selfHwp.stringUtil.delOneCharacter(fieldData));
    }

    // 手書き表示エリアの全ての文字を削除。
    _delAll() {
        selfHwp._setDataToField('');
    }

    // 手書き表示エリアに指定文字を追加。 
    _inputValue(event) {
        var eValue: string = event.target.value;
        var fieldData: any = selfHwp._getDataFromField();
        if (selfHwp.currentType == 'mail') {
            selfHwp._setDataToField(fieldData + eValue);
        } else {
            selfHwp._setDataToField(fieldData + selfHwp._toFullChar(eValue));
        }
    }

    // ボタン入力用半角文字⇒全角文字変換。 
    _toFullChar(char) {
        var result: string = selfHwp.fullCharDef[char];
        return result == null ? '' : result;
    }

    // 指定項目の読み取り専用属性を設定する。
    _setItemReadonly(element, isReadOnly) {
        if (!element) {
            return;
        }
        if (isReadOnly) {
            element.setAttribute('readonly', 'true');
        } else {
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
            var target: any = document.getElementById(id);
            if (target) {
                return target;
            }
            // 定義内容が不正の場合例外をスロー(共通エラー処理へ)
            throw '手書き入力項目定義id:' + id + 'が画面に存在しません。';
        } else {
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
        switch(type) {
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
}