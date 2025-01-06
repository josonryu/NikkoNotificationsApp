App.directive('row',['$timeout', ($timeout) => {
    return {
        restrict: 'E',
        templateUrl:'pages/common/directive/blockRow.html',
        require: '?^^scroll', // スクロールディレクティブ導入
        transclude: {
            'title': '?rowTitle',
            'info': '?rowInfo',
        },
        scope:{
            title: '@?', // ラベル名
            info: '@?', // 表示内容
        },
        link: ($scope, el, attrs, ctrl) =>{

            if ('required' in attrs && (<any>attrs).required == '') {
                (<any>$scope).alwaysHasMark = true;
            }
            
            $scope.$watch('isRequired', (val) =>{
                (<any>$scope).hasMark = !!val;
            });

            if (ctrl){
                $timeout(()=>{
                    (<any>ctrl).addReadyRows(1);
                });
            }
        },
    };
}]);
