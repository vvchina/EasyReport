var TableReport = {
    init: function () {
        TableReportMVC.View.initControl();
        TableReportMVC.View.bindEvent();
        TableReportMVC.View.bindValidate();
        angular.bootstrap(document,['i18n']);
        TableReportMVC.View.initData();
    }
};

var TableReportCommon = {
    baseUrl: EasyReport.ctxPath + '/report'
};

var TableReportMVC = {
    URLs: {
        getData: {
            url: TableReportCommon.baseUrl + '/table/getData.json',
            method: 'POST'
        },
        exportExcel: {
            url: TableReportCommon.baseUrl + '/table/exportExcel',
            method: 'POST'
        },
        exportLargeExcel: {
            url: TableReportCommon.baseUrl + '/table/exportLargeExcel',
            method: 'POST'
        }
    },
    View: {
        initControl: function () {
            $.parser.parse('#table-report-div');
        	$("#chart").hide();
        	TableReportMVC.Util.openchart(null);
        },
        bindEvent: function () {
            $('#btn-generate').click(TableReportMVC.Controller.generate);
            $('#btn-export-excel').click(TableReportMVC.Controller.exportToExcel);
            $("#table-report-columns input[name='checkAllStatColumn']").click(function (e) {
                var checked = $("#table-report-columns input[name='checkAllStatColumn']").prop("checked");
                $("#table-report-columns input[name='statColumns']").prop("checked", checked);
            });
        },
        bindValidate: function () {
        },
        initData: function () {
//            TableReportMVC.Controller.generate(TableReportMVC.Model.Mode.classic, null);
        }
    },
    Model: {
        Mode: {
            classic: 'classic',// 经典表格模式
            datatables: 'dt'// datatables控件表格模式
        }
    },
    Controller: {
        generate: function (mode, callback) {
            $('#table-report-isRowSpan').val($('#table-report-isMergeRow').prop('checked'));
            $.ajax({
                type: "POST",
                url: TableReportMVC.URLs.getData.url,
                data: $("#table-report-form").serialize(),
                dataType: "json",
                beforeSend: function () {
                    $.messager.progress({
                        title: jQuery.i18n.prop('table.wait'),
                        text: jQuery.i18n.prop('table.generating'),
                    });
                },
                success: function (result) {
                    if (result.success) {
                    	var exportexcelbtn="<div id=\"margindiv\">"
                    		+"<img id=\"btn-export-excel\" title=\""+jQuery.i18n.prop("info.table_export_excel")+"\" style=\"cursor: pointer;padding-right: 5px;\" src=\""+TableReportCommon.baseUrl+"/../assets/custom/easyui/themes/icons/excel_24.png\"/>"
                    		+"<img id=\"chartlink\" style=\"cursor: pointer;padding-right: 5px;\" src=\""+TableReportCommon.baseUrl+"/../assets/custom/easyui/themes/icons/chart_24.png\"/>"
                    	+"</div>";
                        $('#table-report-htmltext-div').html(exportexcelbtn+result.data.htmlTable);
                		$("#chartlink").on('click', function(){
                			$.magnificPopup.instance.close();
                			$("#chart").show();

                			if(!$("#chart").is(":hidden")){
                				var table = $('#easyreport')[0];
                				var json = TableReportMVC.Util.tableToJson(table);
                				TableReportMVC.Util.openchart(json);
                			}
                		});
                        $('#btn-export-excel').click(TableReportMVC.Controller.exportToExcel);
                        $('#btn-export-excel1').click(TableReportMVC.Controller.exportToExcel);
                        TableReportMVC.Util.render(mode || TableReportMVC.Model.Mode.classic);
                        TableReportMVC.Util.filterTable = TableReportMVC.Util.renderFilterTable(result.data);
                        if (callback instanceof Function) {
                            callback();
                        }
                    } else {
                        $.messager.alert(jQuery.i18n.prop('table.operation.hint'), result.data.msg, 'error');
                    }
                },
                complete: function () {
                    $.messager.progress("close");
                }
            });
        },
        exportToExcel: function (e) {
            var htmlText = '';
            htmlText += (TableReportMVC.Util.filterTable || '');
            htmlText += '<table>' + $('#easyreport').html() + '</table>';
            var url = TableReportMVC.URLs.exportExcel.url;
            var data = $('#table-report-form').serializeObject();
            var bytes = TableReportMVC.Util.getExcelBytes(htmlText);
            if (bytes > 200000) {
                htmlText = "large";
                url = TableReportMVC.URLs.exportLargeExcel.url;
                data = $('#table-report-form').serialize();
            }else{
                data["htmlText"] = htmlText;
            }
//            $.messager.progress({
//                title: '请稍后...',
//                text: '报表正在生成中...',
//            });
            $.fileDownload(url, {
                httpMethod: "POST",
                data: data
            }).done(function () {
                $.messager.progress("close");
            }).fail(function () {
                $.messager.progress("close");
            });
            e.preventDefault();
        }
    },
    Util: {
        // 表格中是否跨行
        hasRowSpan: function () {
            var rowspans = $("#easyreport>tbody>tr>td[rowspan]");
            return (rowspans && rowspans.length);
        },
        render: function (mode) {
            var table = $("#easyreport");
            return TableReportMVC.Util.renderSortedTable(table);
        },
    	tableToJson: function(table) {
     		var data = {};

        // first row needs to be headers
        var headers = [];
        for (var i=0; i<table.rows[0].cells.length; i++) {
        	headers[i] = table.rows[0].cells[i].innerText.toLowerCase().replace(/ /gi,'');
        	data[headers[i]] =[];
        }
        data["HEADERS"]=headers;

        // go through cells
        for (var i=1; i<table.rows.length; i++) {

        	var tableRow = table.rows[i];
        	if($.trim(tableRow.innerText).length==0) continue;
        	var rowData = {};

        	for (var j=0; j<tableRow.cells.length; j++) {
        		data[ headers[j] ].push(tableRow.cells[j].innerText);

        	}
        }       

        return data;
    },
    openchart: function(table){
    	var dom =  document.getElementById("chart");
    	var myChart = echarts.init(dom);
    	var app = {};
    	option = null;
    	if(table!=null){
    	option = {
    		title: {
    			text: '',
    		},
    		tooltip: {
    			trigger: 'axis'
    		},
    		legend: {
    			data: table['HEADERS'].slice(1),
    			top: 20,
    			selected:{}
    		},
    		toolbox: {
    			show: true,
    			feature: {
    				dataZoom: {
    					yAxisIndex: 'none'
    				},
    				dataView: {readOnly: false},
    				magicType: {type: ['line', 'bar','stack','tiled']},
    				restore: {},
    				saveAsImage: {}
    			}
    		},
    		xAxis:  {
    			type: 'category',
    			boundaryGap: false,
    			data: table[table['HEADERS'][0]]
    		},
    		yAxis: {
    			type: 'value',
    			axisLabel: {
    				formatter: '{value}'
    			}
    		},
    		series: [
    		]
    	};
    	for(var i=1; i<table['HEADERS'].length; i++){
    		option.series.push({
    			name: table['HEADERS'][i],
    			type:'line',
    			data: table[table['HEADERS'][i]]
    		});
    		option.legend.selected[table['HEADERS'][i]]=false;
    	}
    	}
    	
    	;
    	if (option && typeof option === "object") {
    		myChart.setOption(option, true);
    	}
    },
    createSortedTable: function(table) {
			table.addClass('tablesorter');
        	table.tablesorter({
        		theme : 'green',
        		widthFixed : true,
        		showProcessing: true,
        		headerTemplate : '{content} {icon}', // Add icon for various themes

        		widgets: [ 'zebra', 'stickyHeaders', 'filter' ],

        		widgetOptions: {

        			// extra class name added to the sticky header row
        			stickyHeaders : '',
        			// number or jquery selector targeting the position:fixed element
        			stickyHeaders_offset : 0,
        			// added to table ID, if it exists
        			stickyHeaders_cloneId : '-sticky',
        			// trigger "resize" event on headers
        			stickyHeaders_addResizeEvent : true,
        			// if false and a caption exist, it won't be included in the sticky header
        			stickyHeaders_includeCaption : true,
        			// The zIndex of the stickyHeaders, allows the user to adjust this to their needs
        			stickyHeaders_zIndex : 2,
        			// jQuery selector or object to attach sticky header to
        			stickyHeaders_attachTo : '.mfp-wrap',
        			// jQuery selector or object to monitor horizontal scroll position (defaults: xScroll > attachTo > window)
        			stickyHeaders_xScroll : null,
        			// jQuery selector or object to monitor vertical scroll position (defaults: yScroll > attachTo > window)
        			stickyHeaders_yScroll : null,

        			// scroll table top into view after filtering
        			stickyHeaders_filteredToTop: true

        			// *** REMOVED jQuery UI theme due to adding an accordion on this demo page ***
        			// adding zebra striping, using content and default styles - the ui css removes the background from default
        			// even and odd class names included for this demo to allow switching themes
        			// , zebra   : ["ui-widget-content even", "ui-state-default odd"]
        			// use uitheme widget to apply defauly jquery ui (jui) class names
        			// see the uitheme demo for more details on how to change the class names
        			// , uitheme : 'jui'
        		}
        	});
        },
        renderSortedTable: function (table) {
        	$('#table-report-htmltext-div').addClass('white-popup');
        	$('#table-report-htmltext-div').addClass('mfp-hide');
        	$.magnificPopup.open({
  			  items: {
				    src: '#table-report-htmltext-div', // can be a HTML string, jQuery object, or CSS selector
				    type: 'inline'
				},
        		callbacks: {
        			open: function () {
        				// Will fire when this exact popup is opened
        				// this - is Magnific Popup object
        				TableReportMVC.Util.createSortedTable(table);
        			}
        		}
        	});
        	$("#tablelink").magnificPopup({
        		items: {
        				    src: '#table-report-htmltext-div', // can be a HTML string, jQuery object, or CSS selector
        				    type: 'inline'
        				},
        				callbacks: {
        					open: function () {
        						TableReportMVC.Util.createSortedTable(table);
        				}
        		}
        	});
        	
        },
        renderClassicTable: function (table) {
            $("#easyreport>tbody>tr").click(function () {
                $('#easyreport .selected').removeClass('selected').removeAttr('title');
                $(this).addClass('selected');
            });
            $('#easyreport>tbody>tr').mouseover(function (e) {
                $(this).addClass('selected');
            });
            $('#easyreport>tbody>tr').mouseleave(function (e) {
                $('#easyreport .selected').removeClass('selected').removeAttr('title');
            });

            var noRowSpan = !TableReportMVC.Util.hasRowSpan();
//            table.data('isSort', noRowSpan).fixScroll();

            //如果表格中没有跨行rowspan(暂不支持跨行)
            if (noRowSpan) {
                table.tablesorter({
                    sortInitialOrder: 'desc'
                });
                table.find('easyreport>thead>tr').attr({
                    title: jQuery.i18n.prop('table.click.sort')
                }).css({
                    cursor: "pointer"
                });
            }
        },
        renderDatatables: function (table) {
//        	$('#easyreport').fixedHeaderTable({ footer: true, cloneHeadToFoot: true, fixedColumn: false });
            $('#easyreport').removeClass("easyreport");
            $('#easyreport').addClass('table table-striped table-bordered');
            var dt = $('#easyreport').dataTable({
                "scrollY": "758",
                "scrollX": true,
                "scrollCollapse": true,
                "searching": false,
                "pageLength": 100,
                "lengthMenu": [50, 100, 200, 500, 1000],
                "language": {
                    processing: jQuery.i18n.prop('table.data.loading'),
                    search: jQuery.i18n.prop('table.search'),
                    lengthMenu: jQuery.i18n.prop('table.length.menu'),
                    info: jQuery.i18n.prop('table.info'),
                    infoEmpty: jQuery.i18n.prop('table.info.empty'),
                    infoFiltered: jQuery.i18n.prop('table.info.filtered'),
                    infoPostFix: "",
                    thousands: ",",
                    loadingRecords: jQuery.i18n.prop('table.data.loading'),
                    zeroRecords: jQuery.i18n.prop('table.zero.record'),
                    emptyTable: jQuery.i18n.prop('table.empty'),
                    paginate: {
                        first: jQuery.i18n.prop('table.first.page'),
                        previous: jQuery.i18n.prop('table.previous.page'),
                        next: jQuery.i18n.prop('table.next.page'),
                        last: jQuery.i18n.prop('table.last.page')
                    },
                    aria: {
                        sortAscending: jQuery.i18n.prop('table.asc'),
                        sortDescending: jQuery.i18n.prop('table.desc')
                    }
                }
            });
            $('#easyreport tbody').on('click', 'tr', function () {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                }
                else {
                    dt.$('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                }
            });
        },
        // 将报表上面的过滤信息拼成table，用于写入excel中
        renderFilterTable: function (result) {
            var html = '<table>';
            html += '<tr><td align="center" colspan="' + result.metaDataColumnCount + '"><h3>' + $('#table-report-name').text() + '</h3></td></tr>';
            html += '<tr><td align="right" colspan="' + result.metaDataColumnCount + '"><h3>' +jQuery.i18n.prop('table.export.time') +  TableReportMVC.Util.getCurrentTime() + '</h3></td></tr>';
            $('#table-report-form .j-item').each(function () {
                var type = $(this).attr('data-type');
                if (type === 'date-range') {
                    var input = $(this).find('.combo-text');
                    html += '<tr><td align="right" colspan="' + result.metaDataColumnCount + '"><strong>'+jQuery.i18n.prop('table.time.range')+'</strong>' + input.eq(0).val() + '~' + input.eq(1).val() + '</td></tr>';
                } else if (type === 'checkbox') {
                    html += '<tr><td align="right" colspan="' + result.metaDataColumnCount + '"><strong>'+jQuery.i18n.prop('table.statistic.column.filter')+'</strong>';
                    var rowChoose = [];
                    $(this).find('input[type="checkbox"]:checked').each(function () {
                        rowChoose.push($(this).attr('data-name'));
                    })
                    html += rowChoose.join('、');
                    html += '</td></tr>';
                }
                else if (new RegExp('datebox').test($(this).find("input").attr("class"))) {
                    var label = $(this).find('label').text().replace(':', '');
                    var val = $(this).find("input").attr("value");
                    if (!val) {
                        val = $(this).find('.combo-text').val();
                    }
                    html += '<tr><td><strong>' + label + '</strong></td><td>' + val + '</td></tr>';
                }
                else {
                    var label = $(this).find('label').text().replace(':', '');
                    var val = $(this).find('.combo-text').val();
                    if (!val) {
                        val = $(this).find("input").attr("value");
                    }
                    html += '<tr><td><strong>' + label + '</strong></td><td>' + val + '</td></tr>';
                }
            })
            html += '<tr></tr><tr></tr><tr></tr></table>';
            return html;
        },
        getExcelBytes: function (str) {
            var totalLength = 0;
            var i;
            var charCode;
            for (i = 0; i < str.length; i++) {
                charCode = str.charCodeAt(i);
                if (charCode < 0x007f) {
                    totalLength = totalLength + 1;
                } else if ((0x0080 <= charCode) && (charCode <= 0x07ff)) {
                    totalLength += 2;
                } else if ((0x0800 <= charCode) && (charCode <= 0xffff)) {
                    totalLength += 3;
                }
            }
            return totalLength;
        },
        getCurrentTime: function currentTime() {
            var d = new Date(), str = '';
            str += d.getFullYear() + '-';
            str += d.getMonth() + 1 + '-';
            str += d.getDate() + ' ';
            str += d.getHours() + ':';
            str += d.getMinutes() + ':';
            str += d.getSeconds() + '';
            return str;
        },
        filterTable: null
    }
};
