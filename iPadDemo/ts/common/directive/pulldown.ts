App.directive('pulldown',['AppBizCom','$timeout', (AppBizCom, $timeout)  => {
    return {
        restrict: 'E',
        templateUrl:'pages/common/directive/pulldown.html',
        scope:{
            labelProperty: '@', // ラベル
            valueProperty: '@', // 選択値
            data: '=', // スコープ内該当項目の入力データ
            list: '=', // 該当項目のマスタデータ
            placeholder: '@', // placeholder
            disabled: '=', // 非活性制御用フラグ
            width: '@', // 幅
            change: '&', // 選択変更時のイベント
            id: '@', // 該当項目のid
            idGroup: '@', // グループ項目id定義
            groupIndex: '=?', // グループ項目のインデックス
        },
        link: ($scope, el, attrs) =>{
            if (!(<any>attrs).labelProperty) {(<any>attrs).labelProperty = 'MSY'};
            if (!(<any>attrs).valueProperty) {(<any>attrs).valueProperty = 'CD'};
            if ((<any>attrs).placeholder == undefined) {(<any>attrs).placeholder = '選択する'};
            // グループ項目idがあれば、グループ内各項目のidを更新する（グループ項目id定義 + グループ項目のインデックス）
            if ((<any>attrs).idGroup && (<any>attrs).groupIndex){
                (<any>$scope).id = (<any>attrs).idGroup + (<any>$scope).groupIndex
            };

            (<any>$scope).defaultLabel = (<any>attrs).placeholder;
            (<any>$scope).label= (<any>$scope).defaultLabel;
            (<any>$scope).isSelected = false;

            (<any>$scope).selectChange = ($event, e) =>{
                (<any>$scope).data = e[(<any>$scope).valueProperty];
                angular.isFunction((<any>$scope).change) && $timeout(function() {(<any>$scope).change.apply(null, {value: (<any>$scope).data, $event: $event})});
            };
            $scope.$watch('disabled', (val) => {
                if (val) {
                    (<any>$scope).data = undefined;
                }
            });

            $scope.$watch('data', (val) => {
                if (val && (<any>$scope).list){
                    
                    // 値変更の時、エラーをクリアする
                    AppBizCom.Msg.clearError((<any>attrs).id);
                    AppBizCom.Msg.clearError((<any>$scope).id);

                    var selected = (<any>$scope).list.find((item) => item[(<any>$scope).valueProperty] == val)
                    
                    if (selected) {
                        (<any>$scope).label = selected[(<any>$scope).labelProperty];
                        (<any>$scope).isSelected = true;
                    } else {
                        (<any>$scope).label = (<any>$scope).defaultLabel;
                        (<any>$scope).isSelected = false;
                    }

                }else{
                    (<any>$scope).label = (<any>$scope).defaultLabel;
                    (<any>$scope).isSelected = false;
                }
            });
        }
    };
}]);