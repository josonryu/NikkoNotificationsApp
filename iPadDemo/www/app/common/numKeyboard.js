/// <reference path="../reference.d.ts" />
var myself = null;
// 数字キーボード
class NumKeyboard {
    constructor() {
        // 画面横幅
        this.documentWidth = $(document).width();
        // keyboard全体
        this.$keyboard = $('#numKeyboard');
        // keyboard横幅
        this.keyboardWidth = this.$keyboard.width();
        // keyboard横幅の1/2
        this.halfKeyboardWidth = this.keyboardWidth / 2;
        // keyboard高さ
        this.keyboardHeight = this.$keyboard.height();
        // 三角
        this.$triangle = $('#triangle');
        // 三角高さ絶対値
        this.triangleHeight = Math.abs(this.$triangle.height());
        // 表示状態 true:表示中
        this.isVisable = false;
        // ボタンイベント登録
        this._registManualKeyEvent();
    }
    // 対象入力項目初期化
    init(targetsDef) {
        if (!targetsDef) {
            // 定義が存在しない場合は何もしない
            return;
        }
        for (var index in targetsDef) {
            // 手書き対象項目のid取得attrMaxChar
            var id = targetsDef[index].id;
            // 手書き対象項目element取得
            var target = document.getElementById(id);
            if (target) {
                // 手書き対象項目jquery対象取得
                var jqTgt = $(target);
                jqTgt.addClass('numkeyboard');
                var dispPosClass = targetsDef[index].DispPosClass;
                if (dispPosClass) {
                    jqTgt.addClass(dispPosClass);
                }
                target.onfocus = myself._focusInHandler;
                target.onblur = myself._focusOutHandler;
                jqTgt.attr('readonly', 'true');
            }
        }
        myself.windowHeight = window.innerHeight;
        // イベント登録（他項目touch時に非表示）
        document.ontouchstart = myself._touchStartHandler;
        document.ontouchmove = myself._touchMoveHandler;
    }
    // キータップイベント登録
    _registManualKeyEvent() {
        myself = this;
        // 数値キー
        for (var i = 0; i < 10; i++) {
            var btn = document.getElementById('btnComNumInput' + i);
            btn.ontouchstart = this._inputNumValue;
            btn.onmousedown = this._mousedownHandler;
        }
        var keyDelete = document.getElementById('btnComNumDelete');
        // 削除キー
        keyDelete.ontouchstart = this._deleteNumValue;
        keyDelete.onmousedown = this._mousedownHandler;
        // 閉じるボタン
        var keyClose = document.getElementById('btnComNumClose');
        keyClose.ontouchstart = this._closeKeyboard;
        keyClose.onmousedown = this._mousedownHandler;
    }
    // 数値キークリック
    _inputNumValue(e) {
        var val = myself.inputTarget.val();
        // 最大入力文字数確認
        if (val.length >= myself.inputTarget[0].maxLength && myself.inputTarget[0].maxLength > 0) {
            return;
        }
        myself.inputData = val + e.target.value;
        // 入力
        myself.inputTarget.val(myself.inputData);
        // ngChangeイベントを発生させ
        angular.element(myself.inputTarget).triggerHandler('change');
        return false;
    }
    // 削除キークリック
    _deleteNumValue() {
        if (!myself.inputData) {
            return false;
        }
        myself.inputData = myself.inputTarget.val().slice(0, -1);
        myself.inputTarget.val(myself.inputData);
        // ngChangeイベントを発生させ
        angular.element(myself.inputTarget).triggerHandler('change');
        return false;
    }
    // 閉じるボタンクリック
    _closeKeyboard() {
        if (myself.inputTarget) {
            myself.inputTarget.blur();
        }
        return false;
    }
    // フォーカス取得時の処理
    _focusInHandler(e) {
        myself._noneNumKeyboard();
        // 表示
        myself._setTargetPosition(e.target);
    }
    // フォーカス喪失時の処理
    _focusOutHandler(e) {
        // 非表示
        myself._noneNumKeyboard();
    }
    // mousedown処理
    _mousedownHandler(e) {
        // フォーカス移動させない
        e.preventDefault();
    }
    // touch時の処理
    _touchStartHandler(e) {
        // フォーカス中要素がtouchした要素と同じの場合
        if (document.activeElement == e.target) {
            // 数字キーボード非表示 && touchした要素が現在入力項目と一致する場合 
            if (!myself.isVisable && myself.inputTarget && e.target == myself.inputTarget[0]) {
                // 数字キーボード表示
                myself._setTargetPosition(e.target);
            }
        }
        else {
            // touchした要素が数字キーボード以外の場合
            if ($(e.target).closest('#numKeyboard').length == 0) {
                if (myself.inputTarget) {
                    myself.inputTarget.blur();
                }
            }
            else {
                return false;
            }
        }
    }
    // 表示時にスクロールさせない
    _touchMoveHandler(e) {
        if (myself.isVisable) {
            e.preventDefault();
        }
    }
    // 対象要素の位置取得
    _setTargetPosition(target) {
        // 対象要素保持
        myself.inputTarget = $(target);
        myself.inputData = myself.inputTarget.val();
        // 対象要素の枠色を赤にするため、識別クラス追加
        $(myself.inputTarget).addClass('onfocus');
        // 数値キーボード表示
        this._displayNumKeyboard(target.getBoundingClientRect());
    }
    // 数値キーボード表示処理
    _displayNumKeyboard(rect) {
        // 対象要素の位置取得
        var positionX = rect.left;
        var positionY = rect.top;
        // 対象要素の幅取得
        var targetWidth = rect.width;
        var targetHeight = rect.height;
        // 上右下部表示設定
        var keyboardPositionX = 0;
        var keyboardPositionY = 0;
        this.$triangle.removeClass();
        this.$triangle.css('left', '');
        // スクロールフラグ
        var canScroll = true;
        var keyboardAreaHeight = this.keyboardHeight + this.triangleHeight / 2;
        var scrollToY = positionY <= keyboardAreaHeight ? this.windowHeight - (positionY + keyboardAreaHeight + targetHeight) - 1 : 0;
        var scrollArea = $('.scrollArea');
        if (scrollToY < 0 && scrollArea && scrollArea.hasClass('main-div-area-scroll')) {
            var scrollTarget = document.getElementsByClassName('scrollArea')[0];
            canScroll = scrollTarget.clientHeight + scrollTarget.scrollTop + Math.abs(scrollToY) <= scrollTarget.scrollHeight;
        }
        // 右部表示フラグ
        var canRight = true;
        if (scrollArea) {
            // 上部に十分な余白がある && 下部に十分な余白がある && 右部に十分な余白がある
            canRight = (positionY - (this.keyboardHeight / 2 - targetHeight / 2) - 1 >= 0)
                && (positionY + this.keyboardHeight / 2 + targetHeight / 2 + 1 <= this.windowHeight)
                && (positionX + targetWidth + this.triangleHeight / 2 + this.keyboardWidth + 30 <= this.documentWidth);
        }
        // 右部表示
        if (myself.inputTarget.hasClass('numkeyboard-right') && (canRight || myself.inputTarget.hasClass('password-input'))) {
            var correctionX = 0;
            if ((this.documentWidth - (positionX + targetWidth)) <= this.keyboardWidth + this.triangleHeight / 2 + 30) {
                correctionX = this.keyboardWidth + this.triangleHeight / 2 + 30 + positionX + targetWidth - this.documentWidth;
            }
            keyboardPositionX = positionX + targetWidth + this.triangleHeight / 2 - correctionX;
            keyboardPositionY = (positionY + window.pageYOffset) + targetHeight / 2 - this.keyboardHeight / 2;
            this.$triangle.addClass('numKeyboard_leftTriangle');
        }
        else {
            // 左右位置調整用変数
            var correctionX = 0;
            var keyboardAddClassName = 'numKeyboard_reTriangle';
            var correctionY = 0;
            if (positionY > keyboardAreaHeight || !canScroll) {
                correctionY = correctionY - this.keyboardHeight - (this.triangleHeight / 2);
                // スクロールができない場合、上部表示
                if (!canScroll) {
                    scrollToY = Math.abs(positionY - keyboardAreaHeight - 1);
                    correctionY += scrollToY;
                    if (scrollArea && scrollArea.hasClass('main-div-area-scroll')) {
                        var div = document.getElementsByClassName('scrollArea')[0];
                        div.scrollTop = div.scrollTop - scrollToY;
                    }
                    else {
                        window.scrollTo(0, window.pageYOffset - scrollToY);
                    }
                }
            }
            else {
                // 上下位置調整：キーボードがはみ出ていたらスクロールして調整
                if (scrollToY < 0) {
                    if (scrollArea && scrollArea.hasClass('main-div-area-scroll')) {
                        var div = document.getElementsByClassName('scrollArea')[0];
                        div.scrollTop = div.scrollTop + Math.abs(scrollToY);
                    }
                    else {
                        window.scrollTo(0, window.pageYOffset + Math.abs(scrollToY));
                    }
                }
                else {
                    scrollToY = 0;
                }
                correctionY = targetHeight + (this.triangleHeight / 2) + scrollToY;
                keyboardAddClassName = 'numKeyboard_triangle';
            }
            // 左右位置調整：キーボード表示位置X軸がウィンドウ右端まで余白が30以下の場合
            var diff = positionX + targetWidth / 2 + this.halfKeyboardWidth + 30 - this.documentWidth;
            if (diff > 0) {
                this.$triangle.css('left', this.halfKeyboardWidth + diff);
                correctionX = diff;
            }
            else {
                this.$triangle.css('left', '50%');
            }
            keyboardPositionX = (positionX + window.pageXOffset) + targetWidth / 2 - this.keyboardWidth / 2 - correctionX;
            keyboardPositionY = (positionY + window.pageYOffset) + correctionY;
            // 吹き出し矢印表示用クラス追加
            this.$triangle.addClass(keyboardAddClassName);
        }
        // 数字キーボード表示
        this.$keyboard
            .css("left", keyboardPositionX)
            .css("top", keyboardPositionY)
            .css("display", "block");
        this.isVisable = true;
    }
    // 数値キーボード非表示処理
    _noneNumKeyboard() {
        this.$keyboard.css("display", "none");
        this.isVisable = false;
        // 対象要素の赤枠を解除するため、識別クラス削除
        $(myself.inputTarget).removeClass('onfocus');
    }
}
