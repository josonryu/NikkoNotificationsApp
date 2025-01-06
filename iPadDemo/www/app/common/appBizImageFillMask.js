/*
    修正履歴
    2021/05/27 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ　CAC大橋
    タッチイベント許可するユーザーエージェント条件を修正
 */
/**
 * キャンバス設定定数値
 */
var ImageFillConst;
(function (ImageFillConst) {
    ImageFillConst.CANVAS_AREA_MAX_WIDTH = 886;
    ImageFillConst.CANVAS_AREA_MAX_HEIGHT = 633;
    ImageFillConst.CANVAS_MAX_WIDTH = 2000;
    ImageFillConst.CANVAS_MAX_HEIGHT = 1300;
})(ImageFillConst || (ImageFillConst = {}));
/**
 * ライン太さ種別定数値
 */
(function (ImageFillConst) {
    var LineWidth;
    (function (LineWidth) {
        /**
         * 太さ(細)
         */
        LineWidth.SMALL = 20;
        /**
         * 太さ(中)
         */
        LineWidth.NORMAL = 40;
        /**
         * 太さ(太)
         */
        LineWidth.BOLD = 60;
    })(LineWidth = ImageFillConst.LineWidth || (ImageFillConst.LineWidth = {}));
})(ImageFillConst || (ImageFillConst = {}));
/**
 * ライン太さ種別ID定数値
 */
(function (ImageFillConst) {
    var LineWidthID;
    (function (LineWidthID) {
        /**
         * 太さ(細)
         */
        LineWidthID.SMALL = 1;
        /**
         * 太さ(中)
         */
        LineWidthID.NORMAL = 2;
        /**
         * 太さ(太)
         */
        LineWidthID.BOLD = 3;
    })(LineWidthID = ImageFillConst.LineWidthID || (ImageFillConst.LineWidthID = {}));
})(ImageFillConst || (ImageFillConst = {}));
/**
 * ライン線種別ID定数値
 */
(function (ImageFillConst) {
    var LineModeID;
    (function (LineModeID) {
        /**
         * フリーモード
         */
        LineModeID.FREE = 1;
        /**
         * 直線モード
         */
        LineModeID.STRAIGHT = 2;
    })(LineModeID = ImageFillConst.LineModeID || (ImageFillConst.LineModeID = {}));
})(ImageFillConst || (ImageFillConst = {}));
/**
 * 塗りつぶし画像種別ID定数値
 */
(function (ImageFillConst) {
    var ImageTypeID;
    (function (ImageTypeID) {
        /**
         * 個人番号カード
         */
        ImageTypeID.MY_NUMBER = 1;
        /**
         * 運転免許証
         */
        ImageTypeID.DRIVERS_LICENSE = 2;
    })(ImageTypeID = ImageFillConst.ImageTypeID || (ImageFillConst.ImageTypeID = {}));
})(ImageFillConst || (ImageFillConst = {}));
/**
 * 塗りつぶし画像 表裏 種別ID定数値
 */
(function (ImageFillConst) {
    var FrontBackTypeID;
    (function (FrontBackTypeID) {
        /**
         * 表
         */
        FrontBackTypeID.FRONT = 1;
        /**
         * 裏
         */
        FrontBackTypeID.BACK = 2;
    })(FrontBackTypeID = ImageFillConst.FrontBackTypeID || (ImageFillConst.FrontBackTypeID = {}));
})(ImageFillConst || (ImageFillConst = {}));
/**
 * キャンバス縮小率 種別ID定数値
 */
(function (ImageFillConst) {
    var CanvasRatioTypeID;
    (function (CanvasRatioTypeID) {
        /**
         * 高さ
         */
        CanvasRatioTypeID.HEIGHT = 1;
        /**
         * 幅
         */
        CanvasRatioTypeID.WIDTH = 2;
    })(CanvasRatioTypeID = ImageFillConst.CanvasRatioTypeID || (ImageFillConst.CanvasRatioTypeID = {}));
})(ImageFillConst || (ImageFillConst = {}));
/**
 * 書面画像塗りつぶし処理クラス
 */
class AppBizImageFillMask {
    constructor(canvasID, scrollDomID, originalCanvasID, straightLineCanvasID) {
        /**
         * タップ開始位置(X,y)
         */
        this.moveStartPos = { 'x': 0, 'y': 0 };
        /**
         * スクロール開始位置(X,y)
         */
        this.scrollStartPos = { 'x': 0, 'y': 0 };
        /**
         * 前回描画位置(X,y)
         */
        this.prevPenPos = { 'x': 0, 'y': 0 };
        /**
         * 前々回描画位置(X,y)
         */
        this.prevPenPosArray = [];
        /**
         * キャンバスサイズ拡大率保持
         */
        this.canvasRatio = { 'height': 0, 'width': 0 };
        /**
         * touchmoveイベント呼び出しカウンター
         */
        this.moveCount = 0;
        /**
         * Canvasタップ時呼び出すコールバック保持変数
         */
        this.canvasOnTapCallback = undefined;
        /**
         * タップ位置座標取得
         */
        this.getEventPoint = (e) => {
            var x, y;
            if (navigator.userAgent.match(/iPad/i) != null ||
                navigator.userAgent.match(/iPhone/i) != null ||
                navigator.userAgent.match(/Android/i) != null ||
                // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 開始 20210527
                navigator.userAgent.match(/Macintosh/i) != null) {
                // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 終了 20210527
                x = e.touches[0].pageX - this.positionX;
                y = e.touches[0].pageY - this.positionY;
            }
            else {
                x = e.offsetX;
                y = e.offsetY;
            }
            // 拡大モード中以外はスケール値調整
            if (!this.scaleMode) {
                var cssPropertyString = 'width';
                var fillSize = this.setWidth;
                if (this.canvasRatioType == ImageFillConst.CanvasRatioTypeID.HEIGHT) {
                    cssPropertyString = 'height';
                    fillSize = this.setHeight;
                }
                var nowCanvasSize = $('#' + this.canvasID).css(cssPropertyString).replace('px', '');
                var scaleSmallValue = fillSize / nowCanvasSize;
                x *= scaleSmallValue;
                y *= scaleSmallValue;
            }
            var point = {};
            point['x'] = x;
            point['y'] = y;
            return point;
        };
        /**
         * タブレット用 canvas位置取得保持
         */
        this.setCanvasPosition = () => {
            if (this.scaleMode) {
                return;
            }
            var rect = this.canvas.getBoundingClientRect();
            this.positionX = rect.left + window.pageXOffset;
            this.positionY = rect.top + window.pageYOffset;
        };
        /**
         * タップダウン時イベント処理
         */
        this.onMouseDown = (event) => {
            // ページスクロールを制御
            event.preventDefault();
            // キャンバス位置調整
            this.setCanvasPosition();
            // コールバック関数が登録済みの場合
            if (typeof (this.canvasOnTapCallback) == "function") {
                // 登録済みコールバック関数の実行
                this.canvasOnTapCallback();
            }
            var p = this.getEventPoint(event);
            var x = p['x'];
            var y = p['y'];
            // タッチ移動開始位置
            this.moveStartPos['x'] = x;
            this.moveStartPos['y'] = y;
            // スクロール開始位置
            if (this.scaleMode && this.scrollDomObj != null) {
                var modalScroll = this.scrollDomObj;
                this.scrollStartPos['x'] = modalScroll.scrollLeft;
                this.scrollStartPos['y'] = modalScroll.scrollTop;
            }
            this.isDrag = true;
            // コンテキストのライン太さをセットする        
            this.context.lineWidth = this.lineWidth * this.lineWidthScale;
            this.stLineContext.lineWidth = this.lineWidth * this.lineWidthScale;
            // 消しゴムモードの場合描画色を透明にする
            if (this.eraserMode) {
                this.context.fillStyle = "rgba(255, 255, 255, 0)";
            }
        };
        /**
         * タップ移動時イベント処理
         */
        this.onMouseMove = (event) => {
            // ドラッグ中かチェック
            if (this.isDrag == false) {
                return;
            }
            var p = this.getEventPoint(event);
            // canvas内である事をチェック
            if (0 < p['x'] && p['x'] < this.canvas.width && 0 < p['y'] && p['y'] < this.canvas.height) {
                // ページスクロールを制御
                event.preventDefault();
                // 拡大モード中
                if (this.scaleMode && this.scrollDomObj != null) {
                    var moveScrollX = this.moveStartPos['x'] - p['x'];
                    var moveScrollY = this.moveStartPos['y'] - p['y'];
                    var modalScroll = this.scrollDomObj;
                    modalScroll.scrollLeft = this.scrollStartPos['x'] + moveScrollX;
                    modalScroll.scrollTop = this.scrollStartPos['y'] + moveScrollY;
                    return;
                }
                // 線を描画
                var penX = p['x'];
                var penY = p['y'];
                // フリーモードor消しゴムモード時
                if (this.lineModeID == ImageFillConst.LineModeID.FREE || this.eraserMode) {
                    var lineCap = 'round';
                    // 始点端点のlineCap塗りつぶし描画
                    if (this.prevPenPos['x'] == 0 && this.prevPenPos['y'] == 0) {
                        if (this.moveCount < (this.lineWidth * this.lineWidthScale / 15)) {
                            this.moveCount++;
                            return;
                        }
                        lineCap = 'butt';
                        this.context.beginPath();
                        this.context.moveTo(this.moveStartPos['x'], this.moveStartPos['y']);
                        this.context.lineTo(penX, penY);
                        this.context.lineCap = lineCap;
                        this.context.stroke();
                        this.prevPenPos = { x: penX, y: penY };
                        return;
                    }
                    // 通常の塗りつぶし描画
                    this.context.beginPath();
                    this.context.moveTo(this.prevPenPos['x'], this.prevPenPos['y']);
                    this.context.lineTo(penX, penY);
                    this.context.lineCap = lineCap;
                    this.context.stroke();
                    this.prevPenPosArray.unshift(this.prevPenPos);
                    if (this.prevPenPosArray.length > 20) {
                        this.prevPenPosArray.pop();
                    }
                    this.prevPenPos = { x: penX, y: penY };
                }
                else if (this.lineModeID == ImageFillConst.LineModeID.STRAIGHT) {
                    this.stLineContext.clearRect(0, 0, this.stLineCanvas.width, this.stLineCanvas.height);
                    this.stLineContext.beginPath();
                    this.stLineContext.moveTo(this.moveStartPos['x'], this.moveStartPos['y']);
                    this.stLineContext.lineTo(penX, penY);
                    this.stLineContext.stroke();
                    this.prevPenPos = { x: penX, y: penY };
                }
                return;
            }
            else {
                this.onMouseUp(event);
            }
        };
        /**
         * タップアップ時イベント処理
         */
        this.onMouseUp = (event) => {
            // フリーモード時かつ塗りつぶし履歴がある場合
            if (this.lineModeID == ImageFillConst.LineModeID.FREE && 0 < this.prevPenPosArray.length) {
                // 終点端点のlineCap塗りつぶし描画
                var moveToPoint = { x: 0, y: 0 };
                var prevPos = this.prevPenPos;
                var prevLastPos = { x: 0, y: 0 };
                // 現在位置より前の位置を取得
                if (this.prevPenPosArray.length <= 5) {
                    prevLastPos = this.prevPenPosArray[this.prevPenPosArray.length - 1];
                }
                else {
                    prevLastPos = this.prevPenPosArray[5];
                }
                // 直角三角形の三平方の定理に、「現在位置座標」と「現在位置の数個前座標」を当てはめて、線太さ分先の座標位置を算出
                moveToPoint['x'] = ((this.lineWidth * this.lineWidthScale * (prevPos['x'] - prevLastPos['x'])) / Math.sqrt(Math.pow(prevPos['x'] - prevLastPos['x'], 2) + Math.pow(prevPos['y'] - prevLastPos['y'], 2))) + prevPos['x'];
                moveToPoint['y'] = ((this.lineWidth * this.lineWidthScale * (prevPos['y'] - prevLastPos['y'])) / Math.sqrt(Math.pow(prevPos['x'] - prevLastPos['x'], 2) + Math.pow(prevPos['y'] - prevLastPos['y'], 2))) + prevPos['y'];
                this.context.beginPath();
                this.context.moveTo(prevPos['x'], prevPos['y']);
                this.context.lineTo(moveToPoint['x'], moveToPoint['y']);
                this.context.lineCap = 'butt';
                this.context.stroke();
            }
            // 直線モード時かつ塗りつぶし履歴がある場合
            if (this.lineModeID == ImageFillConst.LineModeID.STRAIGHT && !(this.prevPenPos['x'] == 0 && this.prevPenPos['y'] == 0) && !this.eraserMode) {
                // 線を描画
                this.context.beginPath();
                this.context.moveTo(this.moveStartPos['x'], this.moveStartPos['y']);
                this.context.lineTo(this.prevPenPos['x'], this.prevPenPos['y']);
                this.context.lineCap = "butt";
                this.context.stroke();
                this.stLineContext.clearRect(0, 0, this.stLineCanvas.width, this.stLineCanvas.height);
            }
            // 各種パラメータ初期化
            this.isDrag = false;
            this.prevPenPos = { x: 0, y: 0 };
            this.prevPenPosArray = [];
            this.moveCount = 0;
            // 消しゴムモードの場合描画色を戻す
            if (this.eraserMode) {
                this.context.fillStyle = "rgb(0, 0, 0)";
            }
        };
        // Canvas初期化
        this.canvasID = canvasID;
        this.canvas = document.getElementById(canvasID);
        this.context = this.canvas.getContext('2d');
        if (scrollDomID != null) {
            this.scrollDomObj = document.getElementById(scrollDomID);
        }
        if (originalCanvasID != null) {
            // 背景（撮影画像）とするCanvas初期化
            this.orgCanvasID = originalCanvasID;
            this.orgCanvas = document.getElementById(this.orgCanvasID);
            this.orgContext = this.orgCanvas.getContext('2d');
        }
        if (straightLineCanvasID != null) {
            // 直線描画用のCanvas初期化
            this.stLineCanvasID = straightLineCanvasID;
            this.stLineCanvas = document.getElementById(this.stLineCanvasID);
            this.stLineContext = this.stLineCanvas.getContext('2d');
        }
        // キャンバスImageDataの初期化
        this.imageData = null;
        // Canvasタップ時呼び出すコールバック保持変数の初期化
        this.canvasOnTapCallback = undefined;
    }
    /**
     * 各種パラメータの初期化
     */
    init() {
        // ドラッグ中判定初期化
        this.isDrag = false;
        // 線種モード(初期状態は直線モード)
        this.changeLineMode(ImageFillConst.LineModeID.STRAIGHT);
        // 消しゴムモード判定初期化
        this.eraserMode = false;
        // 線太さ(初期状態は中)
        this.changeLineWidth(ImageFillConst.LineWidthID.NORMAL);
        // 画像拡大モード判定初期化
        this.scaleMode = false;
        return;
    }
    ;
    /**
     * キャンバスリソースの解放処理
     */
    finalize() {
        // 各Canvasの解放
        if (this.context) {
            this.context.beginPath();
            delete this.context;
        }
        if (this.canvas) {
            this.canvas.height = 0;
            this.canvas.width = 0;
            delete this.canvas;
        }
        if (this.orgContext) {
            this.orgContext.beginPath();
            delete this.orgContext;
        }
        if (this.orgCanvas) {
            this.orgCanvas.heght = 0;
            this.orgCanvas.width = 0;
            delete this.orgCanvas;
        }
        // 各Canvasコンテキストの解放
        this.stLineContext.beginPath();
        delete this.stLineContext;
        this.stLineCanvas.height = 0;
        this.stLineCanvas.width = 0;
        delete this.stLineCanvas;
        // 各CanvasDOMの削除
        $('#' + this.canvasID).remove();
        $('#' + this.orgCanvasID).remove();
        $('#' + this.stLineCanvasID).remove();
        // Canvasタップ時呼び出すコールバック保持変数の初期化
        this.canvasOnTapCallback = undefined;
        return;
    }
    ;
    /**
     * BASE64で取得された画像情報をCanvasに描画
     * @param orgImgBase64 背景用Canvasに設定する撮影画像データ
     * @param callback 画像データの読込み完了時に呼ばれるコールバック関数
     * @param filledImgData 塗りつぶし用Canvasに設定する塗りつぶし済み画像データ(任意)
     */
    setImageData(orgImgBase64, callback, filledImgData) {
        if (this.imageData != null) {
            // 画面表示時の画像データを保持
            this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        // 以下、初回遷移時のみ
        // 背景（撮影画像）とするcanvasを描画
        var orgImage = new Image();
        orgImage.onload = () => {
            // キャンバスサイズ取得
            if (orgImage.height > ImageFillConst.CANVAS_MAX_HEIGHT || orgImage.width > ImageFillConst.CANVAS_MAX_WIDTH) {
                // リサイズ
                if (orgImage.width > orgImage.height) {
                    this.setHeight = orgImage.height / (orgImage.width / ImageFillConst.CANVAS_MAX_WIDTH);
                    this.setWidth = ImageFillConst.CANVAS_MAX_WIDTH;
                }
                else {
                    this.setHeight = ImageFillConst.CANVAS_MAX_HEIGHT;
                    this.setWidth = orgImage.width / (orgImage.height / ImageFillConst.CANVAS_MAX_HEIGHT);
                }
            }
            else {
                this.setHeight = orgImage.height;
                this.setWidth = orgImage.width;
            }
            // キャンバス領域サイズ判断
            var canvasHeightRatio = this.setHeight / ImageFillConst.CANVAS_AREA_MAX_HEIGHT;
            var canvasWidthRatio = this.setWidth / ImageFillConst.CANVAS_AREA_MAX_WIDTH;
            this.canvasRatioType = (canvasHeightRatio > canvasWidthRatio) ? ImageFillConst.CanvasRatioTypeID.HEIGHT : ImageFillConst.CanvasRatioTypeID.WIDTH;
            // 線幅スケール値
            var imageHeightScale = this.setHeight / ImageFillConst.CANVAS_MAX_HEIGHT;
            var imageWidthScale = this.setWidth / ImageFillConst.CANVAS_MAX_WIDTH;
            this.lineWidthScale = (imageHeightScale > imageWidthScale) ? imageHeightScale : imageWidthScale;
            // canvas画像を描画
            this.orgCanvas.height = this.setHeight;
            this.orgCanvas.width = this.setWidth;
            this.orgContext.clearRect(0, 0, this.orgCanvas.width, this.orgCanvas.height);
            this.orgContext.drawImage(orgImage, 0, 0, this.orgCanvas.width, this.orgCanvas.height);
            var initFillCanvas = () => {
                this.stLineCanvas.height = this.setHeight;
                this.stLineCanvas.width = this.setWidth;
                this.stLineContext.clearRect(0, 0, this.stLineCanvas.width, this.stLineCanvas.height);
                this.registManualFillEvent();
                if (this.imageData == null) {
                    // 塗りつぶし画面表示時の画像保持
                    this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
                }
            };
            // 塗りつぶし用Canvasを描画
            this.canvas.height = this.setHeight;
            this.canvas.width = this.setWidth;
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (typeof (filledImgData) == 'undefined') {
                // 空の透過キャンバスを描画
                this.context.fillStyle = "rgba(255, 255, 255, 0)";
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                initFillCanvas();
                // コールバック呼び出し
                callback();
            }
            else {
                // 塗りつぶし済み画像を描画
                this.context.putImageData(filledImgData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
                initFillCanvas();
                // コールバック呼び出し
                callback();
            }
        };
        orgImage.src = orgImgBase64;
        $('#' + this.canvasID).hide();
        $('#' + this.orgCanvasID).hide();
    }
    ;
    /**
     * Canvas位置調整処理
     * 塗りつぶしCanvasの表示を背景（撮影画像）のCanvasに合わせる
     */
    ajustCanvasSize() {
        var canvas = $('#' + this.canvasID);
        var orgCanvas = $('#' + this.orgCanvasID);
        var stLineCanvas = $('#' + this.stLineCanvasID);
        canvas.show();
        orgCanvas.show();
        // 塗りつぶし用Canvasの位置・サイズ調整
        canvas.width(orgCanvas.width());
        canvas.height(orgCanvas.height());
        canvas.offset(orgCanvas.offset());
        // 直線塗りつぶし用Canvasの位置・サイズ調整
        stLineCanvas.width(orgCanvas.width());
        stLineCanvas.height(orgCanvas.height());
        stLineCanvas.offset(orgCanvas.offset());
        canvas = null;
        orgCanvas = null;
        stLineCanvas = null;
    }
    ;
    /**
     * Canvasをタップされた場合に呼出すコールバック関数を登録
     * @param onTapCb Canvasタップ時に呼出すコールバック関数
     */
    registCanvasOnTapEvent(onTapCb) {
        // 引数のパラメータが関数ではない場合
        if (typeof (onTapCb) != "function") {
            return;
        }
        // コールバック関数が登録済みの場合
        if (typeof (this.canvasOnTapCallback) == "function") {
            // 登録済みコールバック関数の解放
            this.canvasOnTapCallback == undefined;
        }
        // 関数登録
        this.canvasOnTapCallback = onTapCb;
        return;
    }
    /**
     * キャンバスイベント登録
     */
    registManualFillEvent() {
        if (navigator.userAgent.match(/iPad/i) != null ||
            navigator.userAgent.match(/iPhone/i) != null ||
            navigator.userAgent.match(/Android/i) != null ||
            // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 開始 20210527
            navigator.userAgent.match(/Macintosh/i) != null) {
            // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 終了 20210527
            // タッチイベントの登録
            this.canvas.addEventListener('touchstart', this.onMouseDown, false);
            this.canvas.addEventListener('touchmove', this.onMouseMove, false);
            this.canvas.addEventListener('touchend', this.onMouseUp, false);
            this.canvas.addEventListener('touchcancel', this.onMouseUp, false);
        }
        else {
            // マウスイベントの登録
            this.canvas.addEventListener('mousedown', this.onMouseDown, false);
            this.canvas.addEventListener('mousemove', this.onMouseMove, false);
            this.canvas.addEventListener('mouseup', this.onMouseUp, false);
            this.canvas.addEventListener('mouseout', this.onMouseUp, false);
        }
    }
    /**
     * 全て削除処理
     */
    allClear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    /**
     * 線種モード切り替え
     * @param lineModeID 線種類ID
     */
    changeLineMode(lineModeID) {
        this.lineModeID = lineModeID;
        // 消しゴムモード中だった場合
        if (this.eraserMode) {
            // 消しゴムモードを解除
            this.changeEraserMode(false);
        }
        this.setCanvasPosition();
    }
    ;
    /**
     * 線種モード取得
     */
    getLineMode() {
        return this.lineModeID;
    }
    ;
    /**
     * 消しゴムモード切り替え
     * @param eraseMode 消しゴムモード切替え
     */
    changeEraserMode(eraseMode) {
        this.eraserMode = eraseMode;
        if (this.eraserMode) {
            this.lineWidthBackup = this.lineWidth;
            // 消しゴムモード時の太さは「中」
            this.lineWidth = ImageFillConst.LineWidth.NORMAL;
            this.context.globalCompositeOperation = 'destination-out';
        }
        else {
            // 消しゴムモード時の太さに戻す
            this.lineWidth = this.lineWidthBackup;
            this.context.globalCompositeOperation = 'source-over';
        }
    }
    /**
     * 消しゴムモード判定
     */
    isEraserMode() {
        return this.eraserMode;
    }
    ;
    /**
     * ライン幅変更
     * @param lineWidthID 線太さ種別ID
     */
    changeLineWidth(lineWidthID) {
        // 太さ：中
        var lineWidth = ImageFillConst.LineWidth.NORMAL;
        // 太さ：細
        if (lineWidthID == ImageFillConst.LineWidthID.SMALL) {
            lineWidth = ImageFillConst.LineWidth.SMALL;
        }
        else if (lineWidthID == ImageFillConst.LineWidthID.BOLD) {
            lineWidth = ImageFillConst.LineWidth.BOLD;
        }
        // 線太さ種別とサイン太さを保持する
        this.lineWidthID = lineWidthID;
        this.lineWidth = lineWidth;
        // コンテキストのライン太さをセットする        
        this.context.lineWidth = this.lineWidth;
        this.stLineContext.lineWidth = this.lineWidth;
    }
    /**
     * ライン幅ID取得
     */
    getLineWidthID() {
        return this.lineWidthID;
    }
    ;
    /**
     * 画像拡大切り替え
     * @param scaleMode 画像拡大切換え
     */
    changeScaleMode(scaleMode) {
        this.scaleMode = scaleMode;
    }
    ;
    /**
     * キャンバス縮小率 種別ID定数値取得
     * 縮小率で、高さ、幅のうち、縮小率が高い方の種別を返却
     */
    getCanvasRatioType() {
        return this.canvasRatioType;
    }
    /**
     * 画像モード判定
     */
    isScaleMode() {
        return this.scaleMode;
    }
    ;
    /**
     * 自動塗りつぶし処理
     * @param x マスク処理描画開始位置X軸
     * @param y マスク処理描画開始位置Y軸
     * @param w マスク処理描画幅サイズ
     * @param h マスク処理描画高さサイズ
     */
    autoMaskFill(x, y, w, h) {
        // 矩形塗りつぶし
        this.context.beginPath();
        this.context.fillStyle = "rgb(0, 0, 0)";
        this.context.fillRect(x, y, w, h);
    }
    /**
     * 自動マスク処理
     * @param fillImageType 塗りつぶし対象書面種別
     * @param backFrontType 塗りつぶし書面裏表種別
     */
    autoMask(fillImageType, backFrontType) {
        // マスク情報(1箇所目)
        var maskInfo = { 'x': 0, 'y': 0, 'w': 0, 'h': 0 };
        // マスク情報(2箇所目)
        var maskInfo2 = { 'x': 0, 'y': 0, 'w': 0, 'h': 0 };
        // 書面ごとの情報設定
        switch (fillImageType) {
            // 個人番号カード
            case ImageFillConst.ImageTypeID.MY_NUMBER:
                // 表面
                if (backFrontType == ImageFillConst.FrontBackTypeID.FRONT) {
                    // マスク情報(1箇所目)
                    maskInfo['x'] = this.canvas.width * 0.35;
                    maskInfo['y'] = this.canvas.height * 0.81;
                    maskInfo['w'] = this.canvas.width * 0.62;
                    maskInfo['h'] = this.canvas.height * 0.18;
                    // マスク情報(2箇所目) なし
                    maskInfo2 = undefined;
                }
                else if (backFrontType == ImageFillConst.FrontBackTypeID.BACK) {
                    // マスク情報(1箇所目)
                    maskInfo['x'] = this.canvas.width * 0.06;
                    maskInfo['y'] = this.canvas.height * 0.72;
                    maskInfo['w'] = this.canvas.width * 0.14;
                    maskInfo['h'] = this.canvas.height * 0.22;
                    // マスク情報(2箇所目)
                    maskInfo2['x'] = this.canvas.width * 0.35;
                    maskInfo2['y'] = this.canvas.height * 0.28;
                    maskInfo2['w'] = this.canvas.width * 0.6;
                    maskInfo2['h'] = this.canvas.height * 0.1;
                }
                break;
            // 運転免許証
            case ImageFillConst.ImageTypeID.DRIVERS_LICENSE:
                // 表面
                if (backFrontType == ImageFillConst.FrontBackTypeID.FRONT) {
                    // マスク情報(1箇所目)
                    maskInfo['x'] = this.canvas.width * 0.15;
                    maskInfo['y'] = this.canvas.height * 0.45;
                    maskInfo['w'] = this.canvas.width * 0.45;
                    maskInfo['h'] = this.canvas.height * 0.21;
                    // マスク情報(2箇所目) なし
                    maskInfo2 = undefined;
                }
                else if (backFrontType == ImageFillConst.FrontBackTypeID.BACK) {
                    // マスク情報(1箇所目)
                    maskInfo['x'] = this.canvas.width * 0.01;
                    maskInfo['y'] = this.canvas.height * 0.47;
                    maskInfo['w'] = this.canvas.width * 0.98;
                    maskInfo['h'] = this.canvas.height * 0.5;
                    // マスク情報(2箇所目) なし
                    maskInfo2 = undefined;
                }
                break;
            default:
                return;
        }
        // マスク処理実施
        this.autoMaskFill(maskInfo['x'], maskInfo['y'], maskInfo['w'], maskInfo['h']);
        if (typeof maskInfo2 != 'undefined') {
            this.autoMaskFill(maskInfo2['x'], maskInfo2['y'], maskInfo2['w'], maskInfo2['h']);
        }
        return;
    }
    /**
     * Canvas情報画像をBASE64で取得
     */
    getImageData() {
        return this.canvas.toDataURL();
    }
    /**
     * CanvasのImageDataObjectを取得
     */
    getImageDataObject() {
        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    ;
    /**
     * 描画状態を画面表示時の状態に戻す
     */
    resetFillImage() {
        this.context.putImageData(this.imageData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
    }
    ;
}
