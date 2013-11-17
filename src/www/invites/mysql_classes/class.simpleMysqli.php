<?php
/**
 * simpleDB is functional similarity to DBsimple class by Dmitry Koterov,
 * but written with latest versions of php language
 * and uses fast mysqli extension for mysql queries
 *
 * @author DeusModus <maximebaldin@gmail.com>
 * @link maximebaldin@gmail.com
 * @version 1.2.0
 * @package simpleDB
 * @license http://www.gnu.org/licenses/gpl-3.0.txt
 */

class simpleMysqli extends simpleDB
{
    /**
     * The constructor expects an array, which contains connection settings:
     * <code>
    array('server' => 'localhost',
    'username' => 'root',
    'password' => '',
    'db' => 'auto',
    'port' => 3306,
    'charset' => 'utf8',
    )
     * </code>
     * @pacram  $connectionSettingsArray
     */
    public function __construct($connectionSettingsArray)
    {
        extract($connectionSettingsArray);
        /**
         * @var $db
         * @var $server
         * @var $username
         * @var $password
         * @var $port
         * @var $charset
         */
        //writeLn('Инициация соединения с БД: ', $this->db = $db);
        $this->db_resource = new mysqli($server, $username, $password, $db, $port);
        $this->db_resource->set_charset($charset);
        
        if($this->db_resource->connect_error){
            throw new Exception($this->db_resource->connect_error);
        }
    }

    /**
     * Starting transaction mode<br>
     * <b>Example:</b>
     * <code>
     * $db=new simpleMysqli($config);
     * $db->transactionStart();
     * $db->insert('INSERT INTO `test` set testval=?',20);
     * $db->insert('INSERT INTO `test` set testval=?',10);
     * $db->insert('INSERT INTO `test` set testval=?',123);
     * $db->transactionCommit();
     * </code>
     * @return void
     */
    public function transactionStart()
    {
        $this->db_resource->autocommit(false);
    }

    /**
     * Stops transaction mode and commit query<br>
     * For example look at
     * <b>transactionStart</b> method description
     * @return void
     */
    public function transactionCommit()
    {
        $this->db_resource->commit();
        $this->db_resource->autocommit(true);
    }

    /**
     * RollBack transaction query<br>
     * <b>Example:</b>
     * <code>
     * $db=new simpleMysqli($config);
     * $db->transactionStart();
     * $db->insert('INSERT INTO `test` set testval=?',20);
     * $db->insert('INSERT INTO `test` set testval=?',10);
     * $db->insert('INSERT INTO `test` set testval=?',123);
     * $db->transactionRollBack(); // rollback changes
     * $db->transactionCommit(); // insert did not occur
     * </code>
     * @return void
     */
    public function transactionRollBack()
    {
        $this->db_resource->rollback();
    }

    /**
     * Method for SELECT-like query
     * @return array|string|bool false=fail;<br>array=some methods like select, selectCol and others<br> string=methods like selectCell
     */
    protected function s_query()
    {
        $data = null;
        $arguments = func_get_args();
        $this->query($arguments);
        if (!$this->stmp) return false;

        $execute = $this->stmp->execute();
        if (!$execute) return false;

        $result = $this->bindResult($data);
        if (!$result) return false;

        $returnPrepareMethod = $this->returnMethod;
        $rows = $this->$returnPrepareMethod($data);
        $this->setQueryInfo();
        return $rows;
    }

    public function simpleQuery($query){
        return $this->db_resource->query($query);
    }

    protected function query($arguments)
    {
        $this->prepareQuery($arguments);
        $query = $arguments[0];

        if ($this->stmp) $this->stmp->close();

        $this->stmp = $this->db_resource->prepare($query);
        if (!$this->stmp) return false;

        if (count($arguments) > 1) {
            $bindVars = $arguments;
            unset($bindVars[0]);
            $params = array();
            $binding = $this->bindParams($bindVars, $params);
            if (!$binding) return false;
        }
        return true;
    }

    /**
     * Method for INSERT/DELETE-like query
     * @return bool|MySQLi_STMT
     */
    protected function i_query()
    {
        $arguments = func_get_args();
        $this->query($arguments);
        if (!$this->stmp) return false;

        $execute = $this->stmp->execute();
        if (!$execute) return false;
        $this->setQueryInfo();
        return true;
    }

    /**
     * Assign to public var <b>queryInfo</b> additional info, like "num_rows" and "affected_rows"
     * @return void
     */
    protected function setQueryInfo()
    {
        $info = array(
            'affected_rows' => $this->stmp->affected_rows,
            'insert_id' => $this->stmp->insert_id,
            'num_rows' => $this->stmp->num_rows,
            'field_count' => $this->stmp->field_count,
            'sqlstate' => $this->stmp->sqlstate,
        );
        $this->queryInfo = $info;
    }

    /**
     * Returns query error
     * @return string
     */
    public function error()
    {
        return $this->db_resource->error;
    }

    /**
     * Returns query error number
     * @return string
     */
    public function errno()
    {
        return $this->db_resource->errno;
    }

    /**
     * Extended placeholder %s (array)<br>
     * @param  $arguments
     * @return void
     */
    protected function prepareQuery(&$arguments)
    {
        $sprintfArg = array();
        $sprintfArg[] = $arguments[0];
        foreach ($arguments as $pos => $var) {
            if (is_array($var)) {
                $insertAfterPosition = $pos;
                $replaceWith = array();
                unset($arguments[$pos]);
                foreach ($var as $arrayVar) {
                    array_splice($arguments, $insertAfterPosition, 0, $arrayVar);
                    $insertAfterPosition++;
                    $replaceWith[] = '?';
                }
                $sprintfArg[] = implode(',', $replaceWith);
            }
        }
        $arguments[0] = call_user_func_array('sprintf', $sprintfArg);
    }

    /**
     * @param  object $stmt of MySQLi_STMT class
     * @param  array $bindVars vars, that contains values for replacing
     * @param  array $params params for binding
     * @return void
     */
    private function bindParams($bindVars, &$params)
    {
        $params[] = $this->getParamTypes($bindVars);
        foreach ($bindVars as $key => $param) {
            $params[] = &$bindVars[$key]; // pass by reference, not value
        }
        return call_user_func_array(array($this->stmp, 'bind_param'), $params);
    }

    /**
     * Bind results with query
     * @param  $data
     * @return mixed
     */
    private function bindResult(&$data)
    {
        $this->stmp->store_result();
        $variables = array();

        $meta = $this->stmp->result_metadata();
        /**
         * @var  mysqli_result $field
         */
        while ($field = $meta->fetch_field()) {
            $variables[] = &$data[$field->name]; // pass by reference, not value
        }
        return call_user_func_array(array($this->stmp, 'bind_result'), $variables);
    }

    /**
     * Mysqli fetch assoc realization
     * @param  $data
     * @return array
     */
    private function mysqliFetchAssoc(&$data)
    {
        $i = 0;
        $array = array();
        while ($this->stmp->fetch())
        {
            $array[$i] = array();
            foreach ($data as $k => $v) {
                $array[$i][$k] = $v;
            }
            $i++;
        }
        return $array;
    }

    /**
     * Mysqli fetch column realization
     * @param  $data
     * @return array
     */
    private function mysqliFetchCol(&$data)
    {
        $i = 0;
        $array = array();
        while ($this->stmp->fetch())
        {
            $array[$i] = array();
            foreach ($data as $v) {
                $array[$i] = $v;
                break;
            }
            $i++;
        }
        return $array;
    }

    /**
     * Mysqli fetch row realization
     * @param  $data
     * @return array
     */
    private function mysqliFetchRow(&$data)
    {
        $this->stmp->fetch();
        return $data;
    }

    /**
     * Mysqli fetch cell realization
     * @param  $data
     * @return string
     */
    private function mysqliFetchCell(&$data)
    {
        $this->stmp->fetch();
        return $data[key($data)];
    }

    /**
     * Return mysqli-comp string like <b>iis</b> (integer,integer,string) for params binding
     * @param  $arguments
     * @return string
     */
    private function getParamTypes($arguments)
    {
        unset($arguments[0]);
        $retval = '';
        foreach ($arguments as $arg) {
            $retval .= $this->getTypeByVal($arg);
        }
        return $retval;
    }

    /**
     * Simple method to detect var type(int,float or string)
     * @param  $variable
     * @return string
     */
    protected function getTypeByVal($variable)
    {
        switch (gettype($variable)) {
            case 'integer':
                $type = 'i';
                break;
            case 'double':
                $type = 'd';
                break;
            default:
                $type = 's';
        }
        return $type;
    }
    /**
     * Возвращает обьект класса mysqli для нереализованных операций
     * @return mysqli
     */
    public function _getObject(){
        return $this->db_resource;
    }

    public function __destruct()
    {
        $this->db_resource->close();
        //writeLn('Соединение с БД ' . $this->db . ' разорвано');
    }
}