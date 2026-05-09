-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE
-- Copie o resultado e cole aqui para que eu possa mapear seu banco perfeitamente.

SELECT 
    table_name as tabela, 
    column_name as coluna, 
    data_type as tipo, 
    is_nullable as nulo
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN ('produtos', 'lojas', 'configuracoes', 'categorias', 'pedidos')
ORDER BY 
    table_name, 
    ordinal_position;
