

module.exports = {

    /**
     * FUNCTION func_name.
     *   [IMPORTING parameters]
     *   [EXPORTING parameters]
     *   [CHANGING  parameters]
     *   [TABLES    parameters]
     *   [RAISING   exc1 exc2 ...]
     *   [EXCEPTIONS exc1 exc2 ...]
     *   <body>
     * ENDFUNCTION.
     *
     * @see https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/ABAPFUNCTION.html
     */
    function_definition: $ => seq(
        gen.kw("function"),
        field("name", $.identifier),
        ".",
        repeat($.__function_parameter_section),
        optional(field("body", alias($.statement_block, $.function_body))),
        gen.kw("endfunction"),
        "."
    ),

    __function_parameter_section: $ => choice(
        gen.kw_tagged("importing", $.__function_parameter_list),
        gen.kw_tagged("exporting", $.__function_parameter_list),
        gen.kw_tagged("changing",  $.__function_parameter_list),
        gen.kw_tagged("tables",    $.__function_parameter_list),
        gen.kw_tagged("raising",   $.raising_list),
        gen.kw_tagged("exceptions", $.__function_exception_list),
    ),

    __function_parameter_list: $ => alias(
        prec.right(repeat1($.__function_parameter)),
        $.parameter_list
    ),

    // VALUE(p) | REFERENCE(p) | p  [TYPE t | LIKE d | STRUCTURE s]  [OPTIONAL | DEFAULT v]
    __function_parameter: $ => prec.right(seq(
        choice(
            $.value_param_spec,
            $.reference_param_spec,
            $.simple_param_spec,
        ),
        optional(choice(
            field("typing", $._typing),
            $.structure_param_spec,
        )),
        optional(choice(
            $.optional_spec,
            field("default", $.param_default_value_spec),
        ))
    )),

    // EXCEPTIONS exc1 exc2 ... [OTHERS]
    __function_exception_list: $ => alias(
        prec.right(seq(
            repeat1($.identifier),
            optional(gen.kw("others"))
        )),
        $.exception_list
    ),

}
