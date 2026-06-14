

module.exports = {

    /**
     * FUNCTION-POOL fugr_name [MESSAGE-ID mid] [LINE-SIZE width].
     *
     * Declares the function group that owns this TOP include.
     * Analogous to REPORT for executable programs.
     *
     * @see https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABAPFUNCTION-POOL.html
     */
    function_pool_statement: $ => seq(
        gen.kw("function-pool"),
        field("name", $.identifier),
        repeat($.__function_pool_addition),
        "."
    ),

    __function_pool_addition: $ => choice(
        $.default_message_class_spec,
        $.line_size_spec,
    ),

}
