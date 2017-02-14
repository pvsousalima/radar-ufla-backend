// **************************************************************************************
//Objeto que representa um operador
function Operator(name,execution_cycles,functional_unit,display_value){
	this.name = name;
	this.execution_cycles = execution_cycles;
	this.functional_unit = functional_unit;
	this.display_value = display_value;
}

// **************************************************************************************
//Objeto que representa uma instrucao
function Instruction(name,source_register1,source_register2,destination_register,operator){
	//Nome (Ex: fp_add (F1, F1, F1))
	this.name = name;
	//registrador fonte1
	this.source_register1 = source_register1;
	//registrador fonte2
	this.source_register2 = source_register2;
	//registrador de destino
	this.destination_register = destination_register;
	//Operdador utilizado
	this.operator = operator;
	//Qual ciclo a instrução foi disparada
	this.issue_cycle = null;
	//Em qual estágio do pipeline está
	this.pipeline_stage = null;
	//=============================================== Nao sabemos ainda ================== :(
	this.execute_counter = 0;
}

// **************************************************************************************

function Change_Execution_Time(operator, new_value){
	// The "- 0" is needed to force converstion of the value to an integer.
	operator.execution_cycles = new_value - 0;
	UpdateDisplay();
}

// **************************************************************************************
//Responsavel por mudar a instrução de acordo com as escolha do usuário
function Change_Add_Instruction(){
	var selected_value = document.insert_instruction_table.operator.options[document.insert_instruction_table.operator.selectedIndex].value;

	if (selected_value == "fp_ld"){
		LoadOffsetField(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.source_register2);
		LoadFPRegisters(document.insert_instruction_table.destination_register);

	}
	else if (selected_value == "fp_sd"){
		LoadOffsetField(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.source_register2);
		LoadFPRegisters(document.insert_instruction_table.destination_register);

	}
	else if (selected_value.substring(0,2) == "fp"){
		LoadFPRegisters(document.insert_instruction_table.source_register1);
		LoadFPRegisters(document.insert_instruction_table.source_register2);
		LoadFPRegisters(document.insert_instruction_table.destination_register);

	}else if(selected_value ==  "int_daddi" || selected_value ==  "int_subi"){		
		LoadOffsetField(document.insert_instruction_table.source_register2);
		LoadIntegerRegisters(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.destination_register);

	}
	else if (selected_value == "int_ld"){
		LoadOffsetField(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.source_register2);
		LoadIntegerRegisters(document.insert_instruction_table.destination_register);

	}
	else if(selected_value == "int_sd"){
		LoadOffsetField(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.source_register2);
		LoadFPRegisters(document.insert_instruction_table.destination_register);

	}
	else if (selected_value == "int_lw"){
		LoadOffsetField(document.insert_instruction_table.source_register2);
		LoadIntegerRegisters(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.destination_register);

	}
	else if(selected_value == "int_sw"){
		LoadOffsetField(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.source_register2);
		LoadIntegerRegisters(document.insert_instruction_table.destination_register);

	}else if(selected_value == "br_beq"){
		LoadIntegerRegisters(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.source_register2);
		LoadOffsetField(document.insert_instruction_table.destination_register);
	}
	else if(selected_value == "br_bnez"){
		LoadIntegerRegisters(document.insert_instruction_table.source_register1);
		LoadOffsetField(document.insert_instruction_table.source_register2);
		ClearRegisters(document.insert_instruction_table.destination_register);
	}else if (selected_value.substring(0,3) == "int"){
		LoadIntegerRegisters(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.source_register2);
		LoadIntegerRegisters(document.insert_instruction_table.destination_register);

	}
	else if (selected_value.substring(0,2) == "br"){
		LoadOffset(document.insert_instruction_table.source_register1);
		LoadIntegerRegisters(document.insert_instruction_table.source_register2);
		ClearRegisters(document.insert_instruction_table.destination_register);

	}
}

// **************************************************************************************
// Essa funcao eh chamada quando a pagina termina de carregar e eh responsavel por 
// configurar os valores do registradores (Ex: passa os registrados para F1, F2, F3 e etc)
// e aumenta os ciclos de execucao
function Page_Load_Complete(){

	console.log("Page_Load_Complete: " + document.insert_instruction_table.source_register1);
	
	//Configura registradores
	LoadFPRegisters(document.insert_instruction_table.source_register1);
	LoadFPRegisters(document.insert_instruction_table.source_register2);
	LoadFPRegisters(document.insert_instruction_table.destination_register);

	//Configura tempo de execucao
	LoadExecutionTime(document.execution_time_table.fp_add_sub_new);
	LoadExecutionTime(document.execution_time_table.fp_mult_new);
	LoadExecutionTime(document.execution_time_table.fp_div_new);
	LoadExecutionTime(document.execution_time_table.int_div_new);
	
}

// **************************************************************************************
/*
* Recebe os parametros do formulário: insert_instruction_table 
*/
function Instruction_Insert(){

	//Cada uma dessas variaveis recebe os valores que foram definidos pelo usuário. Depois elas serão
	//utilizadas para montar uma instrucao.
	var op = document.insert_instruction_table.operator.options[document.insert_instruction_table.operator.selectedIndex].value;
	var src_reg1 = document.insert_instruction_table.source_register1.options[document.insert_instruction_table.source_register1.selectedIndex].value;
	var src_reg2 = document.insert_instruction_table.source_register2.options[document.insert_instruction_table.source_register2.selectedIndex].value;
	var dest_reg = document.insert_instruction_table.destination_register.options[document.insert_instruction_table.destination_register.selectedIndex].value;

	console.log("Operator: " + op);
	console.log("source_register1: " + src_reg1);
	console.log("source_register2: " + src_reg2);
	console.log("destination_register: " + dest_reg);


/*
	instruction_array[total_instructions] = new Instruction();
	instruction_array[total_instructions].source_register1 = src_reg1;
	instruction_array[total_instructions].source_register2 = src_reg2;
	instruction_array[total_instructions].destination_register = dest_reg;
	instruction_array[total_instructions].operator = eval(op);
*/
	
	if (op == "fp_sd" || op == "int_sd"){
		//Essa parte é responsavel pelas instruções de ponto flutuante e inteiros
		instruction_array[total_instructions] = new Instruction("",dest_reg,src_reg2,"null",eval(op));
	}
	else {
		//Essa por instruções de branch
		instruction_array[total_instructions] = new Instruction("",src_reg1,src_reg2,dest_reg,eval(op));
	}

	total_instructions++;
	UpdateDisplay();

	//Reseta os selects das instruções
	document.insert_instruction_table.destination_register.selectedIndex = 0;
	document.insert_instruction_table.source_register1.selectedIndex = 0;
	document.insert_instruction_table.source_register2.selectedIndex = 0;
}

// **************************************************************************************
//Reseta as variaveis do pipeline e atualiza a parte de baixo
function UpdateDisplay(){
	if (total_instructions > 0){
		// Reset all of the pipeline variables.	
		for (i = 0 ; i < total_instructions ; i++){
			instruction_array[i].issue_cycle = null;
			instruction_array[i].pipeline_stage = null;
			instruction_array[i].execute_counter = 0;
		}
		// Reload the bottom frame.
		parent.bottom_frame.location.href='bottom.html';
	}
	else {
		parent.bottom_frame.location.href="about:blank";
	}
}

// **************************************************************************************
//Remove as intrucoes
function RemoveLastInstruction(){

	total_instructions--;
	if (total_instructions < 0){
		total_instructions = 0;
	}
	UpdateDisplay();
}

// **************************************************************************************

function LoadExecutionTime(instruction_pointer){
	var num_of_options = 20;

	instruction_pointer.length = num_of_options;

	for (x = 0 ; x < num_of_options ; x++){
		instruction_pointer.options[x].value = x+1;
		instruction_pointer.options[x].text = x+1;
	}
}

// **************************************************************************************

function LoadIntegerRegisters(register_pointer){
	var num_of_registers = 32;

	register_pointer.length = num_of_registers;

	for (x = 0 ; x < num_of_registers ; x++){
		register_pointer.options[x].text = "R" + (x);
		register_pointer.options[x].value = "R" + (x);
	}
}

// **************************************************************************************

function LoadFPRegisters(register_pointer){
	var num_of_registers = 16;

	register_pointer.length = num_of_registers;

	for (x = 0 ; x < num_of_registers ; x++){
		register_pointer.options[x].text = "F" + (x);
		register_pointer.options[x].value = "F" + (x);
	}
}

// **************************************************************************************

function LoadOffset(register_pointer){
	register_pointer.length = 1;
	register_pointer.options[0].text = "Offset";
	register_pointer.options[0].value = "Offset";
}

// **************************************************************************************

function LoadOffsetField(register_pointer){
	register_pointer.length = 1;
	register_pointer.options[0].text = "Offset";
	register_pointer.options[0].value = "Offset";
}

// **************************************************************************************

function ClearRegisters(register_pointer){
	register_pointer.length = 1;
	register_pointer.options[0].text = " ";
	register_pointer.options[0].value = "null";
}

// **************************************************************************************

function OpenHelp(){
	if ((parent.help_window == null) || (parent.help_window.closed)){
		parent.help_window = window.open('help.html','help_window','width=400,height=500,toolbar=0,scrollbars=1');
	}
	else {
		parent.help_window.focus();
	}
}

// **************************************************************************************

function CloseHelp(){
	if ((parent.help_window != null) && (!parent.help_window.closed)){
		parent.help_window.close();
	}
	parent.help_window = null; 
}

// **************************************************************************************


// *** Main Section ***

var instruction_array_size = 50;
var total_instructions = 0;

// Create all of the operators.
//Instruction(name,source_register1,source_register2,destination_register,operator)
//Operator(name,execution_cycles,functional_unit,display_value)

var fp_mult = new Operator("fp_mult",1,"fp_mult_unit","M");
var fp_add = new Operator("fp_add",1,"fp_add_sub_unit","A");
var fp_sub = new Operator("fp_sub",1,"fp_add_sub_unit","S");
var fp_div = new Operator("fp_div",1,"fp_div_unit","D");
var fp_ld = new Operator("fp_ld",1,"int_unit","EX");
var fp_sd = new Operator("fp_sd",1,"int_unit","EX");

var int_mult = new Operator("int_mult",1,"int_mult_unit","EX(*)");
var int_add  = new Operator("int_add",1,"int_unit","EX(+)");
var int_sub  = new Operator("int_sub",1,"int_unit","EX(-)");
var int_div  = new Operator("int_div",1,"int_div_unit","EX(/)");

//------- operadoes adicionados por mim ------

//imediate
var int_daddi = new Operator("int_daddi",1,"int_unit","EX(*)");
var int_subi = new Operator("int_subi",1,"int_unit","*EX(-)");

//LW/SW
var int_lw  = new Operator("int_lw",1,"int_unit","EX");
var int_sw  = new Operator("int_sw",1,"int_unit","EX");

var br_beq = new Operator("br_beq",1,"br_add","EX");
var br_bnez = new Operator("br_bnez",1,"br_add","EX");
//------- fim operadores adicionadas por mim ------


var br_taken = new Operator("br_taken",1,"br_add"," ");
var br_untaken = new Operator("br_untaken",1,"br_add"," ");

// Create the instruction array.
var instruction_array = new Instruction(instruction_array_size);

// **************************************************************************************

/**
*ADD.D
*SUBD
*MULTD
*DIV.D
*L.D
*S.D 
*ADD
*DADDUI
*SUBI
*MULT
*DIV
*LW
*SW
*BEQ
*BNEZ
*/