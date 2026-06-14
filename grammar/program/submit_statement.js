

module.exports = {

    /**
     * SUBMIT {prog|(prog_var)}
     *        [AND RETURN]
     *        [VIA SELECTION-SCREEN]
     *        [WITH sel {EQ|IN|...} val | IN range]
     *        [EXPORTING LIST TO MEMORY]
     *        [USING SELECTION-SET variant].
     *
     * @see https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABAPSUBMIT.html
     */
    submit_statement: $ => seq(
        gen.kw("submit"),
        field("program", choice(
            $.identifier,
            $.dynamic_expression,
        )),
        repeat($.submit_option),
        "."
    ),

    submit_option: $ => choice(
        $.submit_and_return_spec,
        $.submit_via_selection_screen_spec,
        $.submit_with_spec,
        $.submit_using_selection_set_spec,
        $.submit_exporting_list_spec,
    ),

    // AND RETURN
    submit_and_return_spec: _ => seq(...gen.kws("and", "return")),

    // VIA SELECTION-SCREEN
    submit_via_selection_screen_spec: _ => seq(...gen.kws("via", "selection-screen")),

    // WITH sel IN range  |  WITH sel EQ|=|... val  |  WITH FREE SELECTIONS ...
    submit_with_spec: $ => seq(
        gen.kw("with"),
        choice(
            seq(...gen.kws("free", "selections"), field("selections", $.named_data_object)),
            seq(
                field("selector", $.identifier),
                choice(
                    seq(gen.kw("in"), field("range", $.named_data_object)),
                    seq($._submit_comparison_operator, field("value", $.general_expression)),
                )
            )
        )
    ),

    _submit_comparison_operator: $ => choice(...gen.kws("eq", "ne", "gt", "lt", "ge", "le"), "=", "<>", ">", "<", ">=", "<="),

    // USING SELECTION-SET variant
    submit_using_selection_set_spec: $ => seq(
        ...gen.kws("using", "selection-set"),
        field("variant", $.character_like_expression)
    ),

    // EXPORTING LIST TO MEMORY
    submit_exporting_list_spec: _ => seq(...gen.kws("exporting", "list", "to", "memory")),

}
