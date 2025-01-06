/*
    修正履歴
    2021/05/27 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ　CAC大橋
    タッチイベント許可するユーザーエージェント条件を修正
 */
/**
 * キャンバス設定定数値
 */
namespace ImageFillConst{
    export const CANVAS_AREA_MAX_WIDTH: number = 886;
    export const CANVAS_AREA_MAX_HEIGHT: number = 633;
    export const CANVAS_MAX_WIDTH: number = 2000;
    export const CANVAS_MAX_HEIGHT: number = 1300;
}
/**
 * ライン太さ種別定数値
 */
namespace ImageFillConst.LineWidth{
    /**
     * 太さ(細)
     */
    export const SMALL: number = 20;
    /**
     * 太さ(中)
     */
    export const NORMAL: number = 40;
    /**
     * 太さ(太)
     */
    export const BOLD: number = 60;
}
/**
 * ライン太さ種別ID定数値
 */
namespace ImageFillConst.LineWidthID{
    /**
     * 太さ(細)
     */
    export const SMALL: number = 1;
    /**
     * 太さ(中)
     */
    export const NORMAL: number = 2;
    /**
     * 太さ(太)
     */
    export const BOLD: number = 3;
}
/**
 * ライン線種別ID定数値
 */
namespace ImageFillConst.LineModeID{
    /**
     * フリーモード
     */
    export const FREE: number = 1;
    /**
     * 直線モード
     */
    export const STRAIGHT: number = 2;
}
/**
 * 塗りつぶし画像種別ID定数値
 */
namespace ImageFillConst.ImageTypeID{
    /**
     * 個人番号カード
     */
    export const MY_NUMBER: number = 1;
    /**
     * 運転免許証
     */
    export const DRIVERS_LICENSE: number = 2;
}
/**
 * 塗りつぶし画像 表裏 種別ID定数値
 */
namespace ImageFillConst.FrontBackTypeID{
    /**
     * 表
     */
    export const FRONT: number = 1;
    /**
     * 裏
     */
    export const BACK: number = 2;
}
/**
 * キャンバス縮小率 種別ID定数値
 */
namespace ImageFillConst.CanvasRatioTypeID{
    /**
     * 高さ
     */
    export const HEIGHT: number = 1;
    /**
     * 幅
     */
    export const WIDTH: number = 2;
}

/**
 * 書面画像塗りつぶし処理クラス
 */
class AppBizImageFillMask {

    /**
     * 塗りつぶしモーダルDOMオブジェクト
     */
    private modalDomObj:any;
    /**
     * キャンバスID(塗りつぶし用)
     */
    private canvasID:string;
    /**
     * キャンバスDOMオブジェクト(塗りつぶし用)
     */
    private canvas:any;
    /**
     * キャンバスコンテキスト(塗りつぶし用)
     */
    private context:any;
    /**
     * キャンバスID(背景用)
     */
    private orgCanvasID:string;
    /**
     * キャンバスDOMオブジェクト(背景用)
     */
    private orgCanvas:any;
    /**
     * キャンバスコンテキスト(背景用)
     */
    private orgContext:any;
    /**
     * キャンバスID(直線描画用)
     */
    private stLineCanvasID:string;
    /**
     * キャンバスDOMオブジェクト(直線描画用)
     */
    private stLineCanvas:any;
    /**
     * キャンバスコンテキスト(直線描画用)
     */
    private stLineContext:any;
    /**
     * ドラッグ中判定
     */
    private isDrag:boolean;
    /**
     * スクロール領域DOMオブジェクト
     */
    private scrollDomObj:any;

    /**
     * キャンバスImageData
     */
    private imageData:any;

    /**
     * 線種類ID
     */
    private lineModeID:number;
    /**
     * 消しゴムモード判定
     */
    private eraserMode:boolean;
    /**
     * スケールモード判定
     */
    private scaleMode:boolean;

    /**
     * 線太さ種別ID
     */
    private lineWidthID:number;
    /**
     * 線太さ
     */
    private lineWidth:number;
    /**
     * 消しゴムモード時用線太さ保持
     */
    private lineWidthBackup:number;
    /**
     * 線太さスケール値
     */
    private lineWidthScale:number;

    /**
     * キャンバス高さ設定値保持
     */
    private setHeight:number;
    /**
     * キャンバス幅設定値保持
     */
    private setWidth:number;
    /**
     * キャンバスX軸位置保持
     */
    private positionX:number;
    /**
     * キャンバスY軸位置保持
     */
    private positionY:number;
    /**
     * 読み込んだ画像をImageクラスで保持
     */
    private fillImage:any;

    /**
     * タップ開始位置(X,y)
     */
    private moveStartPos: {[key: string]: number;} = {'x': 0, 'y': 0};
    /**
     * スクロール開始位置(X,y)
     */
    private scrollStartPos: {[key: string]: number;} = {'x': 0, 'y': 0};
    /**
     * 前回描画位置(X,y)
     */
    private prevPenPos: {[key: string]: number;} = {'x': 0, 'y': 0};
    /**
     * 前々回描画位置(X,y)
     */
    private prevPenPosArray: {[key: string]: number;}[] = [];

    /**
     * キャンバスサイズ拡大率保持
     */
    private canvasRatio: {[key: string]: number;} = {'height': 0, 'width': 0};
    /**
     * キャンバスサイズ縮小率種別
     * 縮小率で、高さ、幅のうち、縮小率が高い方の種別を返却
     */
    private canvasRatioType: number;
    
    /**
     * touchmoveイベント呼び出しカウンター
     */
    private moveCount: number = 0;

    /**
     * Canvasタップ時呼び出すコールバック保持変数
     */
    private canvasOnTapCallback: any = undefined;

    /**
     * コンストラクタ
     * @param canvasID 塗りつぶし用キャンバスID
     * @param scrollDomID スクロール領域ID
     * @param originalCanvasID 撮影画像描画用キャンバスID
     * @param straightLineCanvasID 直線塗りつぶし描画用キャンバスID
     */
    constructor(canvasID:string);
    constructor(canvasID:string, scrollDomID:string, originalCanvasID:string, straightLineCanvasID:string);
    constructor(canvasID:string, scrollDomID?:string, originalCanvasID?:string, straightLineCanvasID?:string){
            // Canvas初期化
            this.canvasID	= canvasID;
            this.canvas     = document.getElementById(canvasID);
            this.context    = this.canvas.getContext('2d');

            if(scrollDomID != null){
                this.scrollDomObj	= document.getElementById(scrollDomID);
            }
            if(originalCanvasID != null){
                // 背景（撮影画像）とするCanvas初期化
                this.orgCanvasID = originalCanvasID;
                this.orgCanvas = document.getElementById(this.orgCanvasID);
                this.orgContext = this.orgCanvas.getContext('2d');
            }
            if(straightLineCanvasID != null){
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
    public init() : void {

        // ドラッグ中判定初期化
        this.isDrag     = false;

        // 線種モード(初期状態は直線モード)
        this.changeLineMode(ImageFillConst.LineModeID.STRAIGHT);

        // 消しゴムモード判定初期化
        this.eraserMode = false;

        // 線太さ(初期状態は中)
        this.changeLineWidth(ImageFillConst.LineWidthID.NORMAL);

        // 画像拡大モード判定初期化
        this.scaleMode = false;

        return;
    };

    /**
     * キャンバスリソースの解放処理
     */
    public finalize() : void {
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
    };

    /**
     * BASE64で取得された画像情報をCanvasに描画
     * @param orgImgBase64 背景用Canvasに設定する撮影画像データ
     * @param callback 画像データの読込み完了時に呼ばれるコールバック関数
     * @param filledImgData 塗りつぶし用Canvasに設定する塗りつぶし済み画像データ(任意)
     */
    public setImageData(orgImgBase64:string, callback:Function, filledImgData:any): void {
        if(this.imageData != null){
            // 画面表示時の画像データを保持
            this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        // 以下、初回遷移時のみ
        // 背景（撮影画像）とするcanvasを描画
        var orgImage = new Image();
        orgImage.onload = () => {
            // キャンバスサイズ取得
            if(orgImage.height > ImageFillConst.CANVAS_MAX_HEIGHT || orgImage.width > ImageFillConst.CANVAS_MAX_WIDTH){
                // リサイズ
                if(orgImage.width > orgImage.height){
                    this.setHeight = orgImage.height / (orgImage.width / ImageFillConst.CANVAS_MAX_WIDTH);
                    this.setWidth = ImageFillConst.CANVAS_MAX_WIDTH;
                }else{
                    this.setHeight = ImageFillConst.CANVAS_MAX_HEIGHT;
                    this.setWidth = orgImage.width / (orgImage.height / ImageFillConst.CANVAS_MAX_HEIGHT);
                }
            }else{
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
            if(typeof (filledImgData) == 'undefined'){
                // 空の透過キャンバスを描画
                this.context.fillStyle = "rgba(255, 255, 255, 0)";
                this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
                initFillCanvas();
                // コールバック呼び出し
                callback();
            }else{
                // 塗りつぶし済み画像を描画
                this.context.putImageData(filledImgData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
                initFillCanvas();
                // コールバック呼び出し
                callback();
            }
        }
        orgImage.src = orgImgBase64;
        $('#' + this.canvasID).hide();
        $('#' + this.orgCanvasID).hide();
    };

    /**
     * Canvas位置調整処理
     * 塗りつぶしCanvasの表示を背景（撮影画像）のCanvasに合わせる
     */
    public ajustCanvasSize(): void {
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
    };

    /**
     * Canvasをタップされた場合に呼出すコールバック関数を登録
     * @param onTapCb Canvasタップ時に呼出すコールバック関数
     */
    public registCanvasOnTapEvent(onTapCb:any): void {
        // 引数のパラメータが関数ではない場合
        if(typeof(onTapCb) != "function"){
            return;
        }
        // コールバック関数が登録済みの場合
        if(typeof(this.canvasOnTapCallback) == "function"){
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
    private registManualFillEvent(): void {
        if(navigator.userAgent.match(/iPad/i)   != null ||
        navigator.userAgent.match(/iPhone/i) != null ||
        navigator.userAgent.match(/Android/i) != null ||
        // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 開始 20210527
        navigator.userAgent.match(/Macintosh/i) != null){
        // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 終了 20210527
            // タッチイベントの登録
            this.canvas.addEventListener('touchstart',  this.onMouseDown, false);
            this.canvas.addEventListener('touchmove',   this.onMouseMove, false);
            this.canvas.addEventListener('touchend',    this.onMouseUp,   false);
            this.canvas.addEventListener('touchcancel', this.onMouseUp,   false);
        }else{
            // マウスイベントの登録
            this.canvas.addEventListener('mousedown', this.onMouseDown, false);
            this.canvas.addEventListener('mousemove', this.onMouseMove, false);
            this.canvas.addEventListener('mouseup',   this.onMouseUp,   false);
            this.canvas.addEventListener('mouseout',  this.onMouseUp,   false);
        }
    }

    /**
     * タップ位置座標取得
     */
    private getEventPoint = (e:any): any => {
        var x, y;
        
        if(navigator.userAgent.match(/iPad/i)   != null ||
        navigator.userAgent.match(/iPhone/i) != null ||
        navigator.userAgent.match(/Android/i) != null ||
        // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 開始 20210527
        navigator.userAgent.match(/Macintosh/i) != null){
        // 01-2021-04-430 【ｉＰａｄ口座開設・事務手続きアプリ】ｉＯＳ１４対応のバージョンアップ 終了 20210527
            x = e.touches[0].pageX - this.positionX;
            y = e.touches[0].pageY - this.positionY;
        }
        else{
            x = e.offsetX;
            y = e.offsetY;
        }

        // 拡大モード中以外はスケール値調整
        if(!this.scaleMode){
            var cssPropertyString:string = 'width';
            var fillSize:number = this.setWidth;
            if(this.canvasRatioType == ImageFillConst.CanvasRatioTypeID.HEIGHT){
                cssPropertyString = 'height';
                fillSize = this.setHeight;
            }
            var nowCanvasSize: any = $('#' + this.canvasID).css(cssPropertyString).replace('px', '');
            var scaleSmallValue:number = fillSize / nowCanvasSize;
            x *= scaleSmallValue;
            y *= scaleSmallValue;
        }
        
        var point: {[key: string]: number;} = {};
        point['x'] = x;
        point['y'] = y;
        return point;
    }

    /**
     * タブレット用 canvas位置取得保持
     */
    private setCanvasPosition = (): void => {
        if(this.scaleMode){ return; }
        var rect = this.canvas.getBoundingClientRect();
        this.positionX = rect.left + window.pageXOffset;
        this.positionY = rect.top + window.pageYOffset;
    }

    /**
     * タップダウン時イベント処理
     */
    private onMouseDown = (event:any) => {
        // ページスクロールを制御
        event.preventDefault();

        // キャンバス位置調整
        this.setCanvasPosition();

        // コールバック関数が登録済みの場合
        if(typeof(this.canvasOnTapCallback) == "function"){
            // 登録済みコールバック関数の実行
            this.canvasOnTapCallback();
        }
        
        var p = this.getEventPoint(event);
        var x = p['x'];
        var y = p['y'];
        // タッチ移動開始位置
        this.moveStartPos['x']	= x;
        this.moveStartPos['y']	= y;
        // スクロール開始位置
        if(this.scaleMode && this.scrollDomObj != null){
            var modalScroll = this.scrollDomObj;
            this.scrollStartPos['x']	= modalScroll.scrollLeft;
            this.scrollStartPos['y']	= modalScroll.scrollTop;
        }
        this.isDrag = true;
        // コンテキストのライン太さをセットする        
        this.context.lineWidth = this.lineWidth * this.lineWidthScale;
        this.stLineContext.lineWidth = this.lineWidth * this.lineWidthScale;
        // 消しゴムモードの場合描画色を透明にする
        if (this.eraserMode) {
            this.context.fillStyle = "rgba(255, 255, 255, 0)";
        }
    }

    /**
     * タップ移動時イベント処理
     */
    private onMouseMove = (event:any) => {
    	// ドラッグ中かチェック
        if(this.isDrag == false){ return; }
        var p = this.getEventPoint(event);
        // canvas内である事をチェック
        if(0 < p['x'] && p['x'] < this.canvas.width && 0 < p['y'] && p['y'] < this.canvas.height){
            // ページスクロールを制御
            event.preventDefault();

            // 拡大モード中
            if(this.scaleMode && this.scrollDomObj != null){
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
            if(this.lineModeID == ImageFillConst.LineModeID.FREE || this.eraserMode){

                var lineCap = 'round';
                // 始点端点のlineCap塗りつぶし描画
                if(this.prevPenPos['x'] == 0 && this.prevPenPos['y'] == 0){
                    if(this.moveCount < (this.lineWidth * this.lineWidthScale / 15)){
                        this.moveCount++;
                        return;
                    }
                    lineCap = 'butt';
                    this.context.beginPath();
                    this.context.moveTo(this.moveStartPos['x'], this.moveStartPos['y']);
                    this.context.lineTo(penX, penY);
                    this.context.lineCap = lineCap;
                    this.context.stroke();
                    this.prevPenPos = {x:penX, y:penY};
                    return;
                }
                // 通常の塗りつぶし描画
                this.context.beginPath();
                this.context.moveTo(this.prevPenPos['x'], this.prevPenPos['y']);
                this.context.lineTo(penX, penY);
                this.context.lineCap = lineCap;
                this.context.stroke();
                this.prevPenPosArray.unshift(this.prevPenPos);
                if(this.prevPenPosArray.length > 20){
                    this.prevPenPosArray.pop();
                }
                this.prevPenPos = {x:penX, y:penY};
            }
            // 直線モード時
            else if(this.lineModeID == ImageFillConst.LineModeID.STRAIGHT){
                this.stLineContext.clearRect(0, 0, this.stLineCanvas.width, this.stLineCanvas.height);
                this.stLineContext.beginPath();
                this.stLineContext.moveTo(this.moveStartPos['x'], this.moveStartPos['y']);
                this.stLineContext.lineTo(penX, penY);
                this.stLineContext.stroke();
                this.prevPenPos = { x: penX, y: penY };
            }
            return;
        }
        else{
            this.onMouseUp(event);
        }
    }

    /**
     * タップアップ時イベント処理
     */
    private onMouseUp = (event:any) => {
        // フリーモード時かつ塗りつぶし履歴がある場合
        if(this.lineModeID == ImageFillConst.LineModeID.FREE && 0 < this.prevPenPosArray.length){
            // 終点端点のlineCap塗りつぶし描画
            var moveToPoint: {[key: string]: number;} = {x:0, y:0};
            var prevPos: {[key: string]: number;} = this.prevPenPos;
            var prevLastPos: {[key: string]: number;} = {x:0, y:0};
            // 現在位置より前の位置を取得
            if(this.prevPenPosArray.length <= 5){
                prevLastPos = this.prevPenPosArray[this.prevPenPosArray.length - 1];
            }else{
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
        if (this.lineModeID == ImageFillConst.LineModeID.STRAIGHT &&  !(this.prevPenPos['x'] == 0 && this.prevPenPos['y'] == 0) && !this.eraserMode) {
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
        this.prevPenPos = {x:0, y:0};
        this.prevPenPosArray = [];
        this.moveCount = 0;
        // 消しゴムモードの場合描画色を戻す
        if (this.eraserMode) {
            this.context.fillStyle = "rgb(0, 0, 0)";
        }
    }

    /**
     * 全て削除処理
     */
    public allClear() : void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * 線種モード切り替え
     * @param lineModeID 線種類ID
     */
    public changeLineMode(lineModeID:number) : void {
        this.lineModeID = lineModeID;
        // 消しゴムモード中だった場合
        if(this.eraserMode){
            // 消しゴムモードを解除
            this.changeEraserMode(false);
        }
        this.setCanvasPosition();
    };

    /**
     * 線種モード取得
     */
    public getLineMode() : number {
        return this.lineModeID;
    };

    /**
     * 消しゴムモード切り替え
     * @param eraseMode 消しゴムモード切替え
     */
    public changeEraserMode(eraseMode:boolean) : void {
        this.eraserMode = eraseMode;
        if(this.eraserMode){
            this.lineWidthBackup = this.lineWidth;
            // 消しゴムモード時の太さは「中」
            this.lineWidth = ImageFillConst.LineWidth.NORMAL;
            this.context.globalCompositeOperation = 'destination-out';
        }
        else{
            // 消しゴムモード時の太さに戻す
            this.lineWidth = this.lineWidthBackup;
            this.context.globalCompositeOperation = 'source-over';
        }
    }

    /**
     * 消しゴムモード判定
     */
    public isEraserMode() : boolean {
        return this.eraserMode;
    };

    /**
     * ライン幅変更
     * @param lineWidthID 線太さ種別ID
     */
    public changeLineWidth(lineWidthID:number) : void {
        // 太さ：中
        var lineWidth = ImageFillConst.LineWidth.NORMAL;
        // 太さ：細
        if(lineWidthID == ImageFillConst.LineWidthID.SMALL){
            lineWidth = ImageFillConst.LineWidth.SMALL;
        }
        // 太さ：太
        else if(lineWidthID == ImageFillConst.LineWidthID.BOLD){
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
    public getLineWidthID() : number {
        return this.lineWidthID;
    };

    /**
     * 画像拡大切り替え
     * @param scaleMode 画像拡大切換え
     */
    public changeScaleMode(scaleMode:boolean) : void {
        this.scaleMode = scaleMode;
    };    

    /**
     * キャンバス縮小率 種別ID定数値取得
     * 縮小率で、高さ、幅のうち、縮小率が高い方の種別を返却
     */
    public getCanvasRatioType() : number {
        return this.canvasRatioType;
    }

    /**
     * 画像モード判定
     */
    public isScaleMode() : boolean {
        return this.scaleMode;
    };

    /**
     * 自動塗りつぶし処理
     * @param x マスク処理描画開始位置X軸
     * @param y マスク処理描画開始位置Y軸
     * @param w マスク処理描画幅サイズ
     * @param h マスク処理描画高さサイズ
     */
    private autoMaskFill(x, y, w, h) : void {
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
    public autoMask(fillImageType:number, backFrontType:number) : void {
        // マスク情報(1箇所目)
        var maskInfo: {[key: string]: number;} = {'x': 0, 'y': 0, 'w': 0, 'h': 0};
        // マスク情報(2箇所目)
        var maskInfo2: {[key: string]: number;} = {'x': 0, 'y': 0, 'w': 0, 'h': 0};
        // 書面ごとの情報設定
        switch(fillImageType){
            // 個人番号カード
            case ImageFillConst.ImageTypeID.MY_NUMBER:
                // 表面
                if(backFrontType == ImageFillConst.FrontBackTypeID.FRONT){
                    // マスク情報(1箇所目)
                    maskInfo['x'] = this.canvas.width * 0.35;
                    maskInfo['y'] = this.canvas.height * 0.81;
                    maskInfo['w'] = this.canvas.width * 0.62;
                    maskInfo['h'] = this.canvas.height * 0.18;
                    // マスク情報(2箇所目) なし
                    maskInfo2 = undefined;
                }
                // 裏面
                else if(backFrontType == ImageFillConst.FrontBackTypeID.BACK){
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
                if(backFrontType == ImageFillConst.FrontBackTypeID.FRONT){
                    // マスク情報(1箇所目)
                    maskInfo['x'] = this.canvas.width * 0.15;
                    maskInfo['y'] = this.canvas.height * 0.45;
                    maskInfo['w'] = this.canvas.width * 0.45;
                    maskInfo['h'] = this.canvas.height * 0.21;
                    // マスク情報(2箇所目) なし
                    maskInfo2 = undefined;
                    // 本籍
                    // maskInfo2['x'] = this.canvas.width * 0.02;
                    // maskInfo2['y'] = this.canvas.height * 0.12;
                    // maskInfo2['w'] = this.canvas.width * 0.96;
                    // maskInfo2['h'] = this.canvas.height * 0.08;
                }
                // 裏面
                else if(backFrontType == ImageFillConst.FrontBackTypeID.BACK){
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
        if(typeof maskInfo2 != 'undefined'){
            this.autoMaskFill(maskInfo2['x'], maskInfo2['y'], maskInfo2['w'], maskInfo2['h']);
        }
        return;
    }

    /**
     * Canvas情報画像をBASE64で取得
     */
    public getImageData() : string {
        return this.canvas.toDataURL();
    }

    /**
     * CanvasのImageDataObjectを取得
     */
    public getImageDataObject() : any {
        return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    };

    /**
     * 描画状態を画面表示時の状態に戻す
     */
    public resetFillImage() : any {
        this.context.putImageData(this.imageData, 0, 0, 0, 0, this.canvas.width, this.canvas.height);
    };

}