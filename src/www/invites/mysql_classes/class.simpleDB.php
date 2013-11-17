<?php
abstract class simpleDB
{
    /**
     * MySQLi object
     * @var MySQLi
     */
    protected $db_resource;
    /**
     * Method name to prepare data for select-like query
     * @var string
     */
    protected $returnMethod;
    /**
     * Assoc array with query info(affected_rows,num_rows,etc)
     * @var array
     */
    public $queryInfo;
    /**
     * @var MySQLi_STMT $stmp
     */
    protected $stmp;

    /**
     * @param  $query
     * @return array|false
     */
    public function select($query)
    {
        $this->returnMethod = 'mysqliFetchAssoc';
        $arguments = func_get_args();
        return call_user_func_array(array($this, 's_query'), $arguments);
    }

    /**
     * @param  $query
     * @return array|false
     */
    public function selectCol($query)
    {
        $this->returnMethod = 'mysqliFetchCol';
        $arguments = func_get_args();
        return call_user_func_array(array($this, 's_query'), $arguments);
    }

    /**
     * @param  $query
     * @return string
     */
    public function selectCell($query)
    {
        $this->returnMethod = 'mysqliFetchCell';
        $arguments = func_get_args();
        return call_user_func_array(array($this, 's_query'), $arguments);
    }

    /**
     * @param  $query
     * @return array|false
     */
    public function selectRow($query)
    {
        $this->returnMethod = 'mysqliFetchRow';
        $arguments = func_get_args();
        return call_user_func_array(array($this, 's_query'), $arguments);
    }

    /**
     * @param  $query
     * @return boolean
     */
    public function update($query)
    {
        $arguments = func_get_args();
        return call_user_func_array(array($this, 'i_query'), $arguments);
    }

     /**
     * @param  $query
     * @return boolean
     */
    public function insert($query)
    {
        $arguments = func_get_args();
        return call_user_func_array(array($this, 'i_query'), $arguments);
    }

     /**
     * @param  $query
     */
    public function replace($query)
    {
        $arguments = func_get_args();
        return call_user_func_array(array($this, 'i_query'), $arguments);
    }
    
     /**
     * @param  $query
     * @return boolean
     */
    public function delete($query)
    {
        $arguments = func_get_args();
        return call_user_func_array(array($this, 'i_query'), $arguments);
    }

}