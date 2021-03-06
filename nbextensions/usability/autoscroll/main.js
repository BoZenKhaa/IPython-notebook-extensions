define([
    'jquery',
    'base/js/namespace',
    'base/js/utils',
    'services/config',
    'notebook/js/outputarea'
], function (
    $,
    IPython,
    utils,
    configmod,
    oa
) {
    "use strict";

    var prev_threshold = 0;

    // define default values for config parameters
    var params = {
        autoscroll_set_on_load : false,
        autoscroll_starting_threshold : 100,
        autoscroll_show_selector : true,
        autoscroll_show_button : false
    };

    // create config object to load parameters
    var base_url = utils.get_body_data("baseUrl");
    var config = new configmod.ConfigSection('notebook', {base_url: base_url});

    // update params with any specified in the server's config file
    var update_params = function() {
        for (var key in params) {
            if (config.data.hasOwnProperty(key))
                params[key] = config.data[key];
        }
    };

    var toggle_output_autoscroll = function() {
        if (oa.OutputArea.auto_scroll_threshold > 0) {
            prev_threshold = oa.OutputArea.auto_scroll_threshold;
            oa.OutputArea.auto_scroll_threshold = -1;
        }
        else {
            var new_thr = prev_threshold <= 0 ? 1 : prev_threshold;
            prev_threshold = oa.OutputArea.auto_scroll_threshold;
            oa.OutputArea.auto_scroll_threshold = new_thr;
        }

        $('#autoscroll_selector').val(oa.OutputArea.auto_scroll_threshold);

        $('.btn[data-jupyter-action="auto.toggle-output-autoscroll"]')
            .toggleClass('active', oa.OutputArea.auto_scroll_threshold <= 0)
            .blur();
    };

    config.loaded.then( function() {
        update_params();

        var thresholds = [-1, 1, 10, 20, 50, 100, 200, 500, 1000];

        if (params.autoscroll_set_on_load) {
            var st = params.autoscroll_starting_threshold;
            oa.OutputArea.auto_scroll_threshold(st);
            if (thresholds.indexOf(st) < 0) thresholds.push(st);
        }

        thresholds.sort(function(a, b){ return a-b; });

        if (params.autoscroll_show_selector) {
            var select = $('<select id="autoscroll_selector"/>')
                .addClass("form-control select-xs");
            select.change(function() {
                oa.OutputArea.auto_scroll_threshold = parseInt($(this).val(), 10);
                $('.btn[data-jupyter-action="auto.toggle-output-autoscroll"]')
                    .toggleClass('active', oa.OutputArea.auto_scroll_threshold <= 0);
                $(this).blur();
            });
            for (var i in thresholds) {
                var thr = thresholds[i];
                select.append($('<option/>').attr('value', thr).text(thr));
            }
            select.find('option[value="100"]').text('100 (default)');
            select.find('option[value="-1"]').text('no-scroll');
            IPython.toolbar.element.append(
                $('<label class="navbar-text"/>').text('auto-scroll threshold:')
            ).append(select);
            select.val(oa.OutputArea.auto_scroll_threshold);
        }

        if (params.autoscroll_show_button) {
            IPython.toolbar.add_buttons_group(['auto.toggle-output-autoscroll']);
        }
    });

    var load_ipython_extension = function () {
        var prefix = 'auto';
        var action_name = 'toggle-output-autoscroll';
        var action = {
            icon: 'fa-close',
            help: 'Toggle output auto-scrolling',
            help_index : 'zz',
            handler : toggle_output_autoscroll
        };

        IPython.notebook.keyboard_manager.actions.register(action, action_name, prefix);

        config.load();
    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});
