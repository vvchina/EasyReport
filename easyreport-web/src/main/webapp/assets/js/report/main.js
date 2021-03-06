$(function () {
    ReportPreviewMain.init();
});

var ReportPreviewMain = {
    init: function () {
        PreviewMainMVC.View.initControl();
        PreviewMainMVC.View.bindEvent();
        PreviewMainMVC.View.bindValidate();
        PreviewMainMVC.View.initData();
    }
};

var PreviewCommon = {
    baseUrl: EasyReport.ctxPath + '/report'
};

var PreviewMainMVC = {
    URLs: {
        table: {
            url: PreviewCommon.baseUrl + '/table/uid/${uid}?theme=content',
            method: 'GET'
        },
        chart: {
            url: PreviewCommon.baseUrl + '/chart/uid/${uid}?theme=content',
            method: 'GET'
        }
    },
    View: {
        initControl: function () {
        },
        bindEvent: function () {
        },
        bindValidate: function () {
        },
        initData: function () {
            var uid = $('#report-main-uid').val();
            var tableUrl = juicer(PreviewMainMVC.URLs.table.url, {uid: uid});
            
            PreviewMainMVC.Controller.updatePanel( 0, tableUrl, TableReport.init);
            
        }
    },
    Controller: {
    	updatePanel: function (which, href, onLoad) {
            $('#report-main-panel').panel({
                href:href,
                onLoad:function(){
                	onLoad();
                }
            });
        }
    }
};