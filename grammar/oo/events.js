

module.exports = {

    /**
     * RAISE EVENT evt_name [EXPORTING p1 = val1 p2 = val2 ...].
     *
     * Raises a class-based event declared with EVENTS or CLASS-EVENTS.
     * Note: disambiguated from RAISE EXCEPTION by the EVENT keyword.
     *
     * @see https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABAPRAISE_EVENT.html
     */
    raise_event_statement: $ => seq(
        gen.kw("raise"),
        gen.kw("event"),
        field("name", $.identifier),
        optional(gen.kw_tagged("exporting", $._named_argument_list)),
        "."
    ),

    /**
     * SET HANDLER handler->meth1 handler->meth2 ...
     *   {FOR obj | FOR ALL INSTANCES} [ACTIVATION flag].
     *
     * @see https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABAPSET_HANDLER.html
     */
    set_handler_statement: $ => seq(
        ...gen.kws("set", "handler"),
        field("handlers", repeat1($.component_expression)),
        gen.kw("for"),
        field("for", choice(
            $.set_handler_all_instances_spec,
            $.named_data_object,
        )),
        optional($.handler_activation_spec),
        "."
    ),

    // FOR ALL INSTANCES
    set_handler_all_instances_spec: _ => seq(...gen.kws("all", "instances")),

    // ACTIVATION flag
    handler_activation_spec: $ => seq(
        gen.kw("activation"),
        field("flag", $.general_expression)
    ),

    /**
     * Declaration of class events (inside CLASS DEFINITION or INTERFACE).
     * EVENTS evt [EXPORTING VALUE(p) TYPE t ...].
     * CLASS-EVENTS evt [EXPORTING VALUE(p) TYPE t ...].
     *
     * @see https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABAPEVENTS.html
     */
    events_declaration: $ => gen.chainable(
        "events",
        $.event_spec
    ),

    class_events_declaration: $ => gen.chainable(
        "class-events",
        $.event_spec
    ),

    event_spec: $ => seq(
        field("name", $.identifier),
        optional(gen.kw_tagged("exporting", $.__event_parameter_list))
    ),

    __event_parameter_list: $ => alias(
        repeat1($.__event_parameter),
        $.parameter_list
    ),

    __event_parameter: $ => prec.right(seq(
        $.value_param_spec,
        optional(field("typing", $._typing)),
    )),

}
