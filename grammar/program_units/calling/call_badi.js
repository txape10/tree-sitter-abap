

module.exports = {

    /**
     * GET BADI badi_ref
     *   [TYPE intf]
     *   [FILTERS f1 = val1 f2 = val2 ...].
     *
     * Obtains a BADI instance (classic kernel BADIs).
     *
     * @see https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABAPGET_BADI.html
     */
    get_badi_statement: $ => seq(
        ...gen.kws("get", "badi"),
        field("instance", $.writable_expression),
        optional(seq(
            gen.kw("type"),
            field("type", $.identifier)
        )),
        optional(gen.kw_tagged("filters", $._named_argument_list)),
        "."
    ),

    /**
     * CALL BADI badi_ref->method_name
     *   [EXPORTING  p1 = val1 ...]
     *   [IMPORTING  p2 = val2 ...]
     *   [CHANGING   p3 = val3 ...]
     *   [EXCEPTIONS ...].
     *
     * @see https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABAPCALL_BADI.html
     */
    call_badi_statement: $ => seq(
        ...gen.kws("call", "badi"),
        field("method", $.component_expression),
        optional($.call_argument_list),
        "."
    ),

}
