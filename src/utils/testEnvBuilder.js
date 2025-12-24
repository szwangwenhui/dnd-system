// 测试环境搭建工具
// 用于快速创建基础测试环境，避免每次清除缓存后重复手动配置

window.TestEnvBuilder = {
  /**
   * 搭建完整测试环境
   * 创建：1个项目 + 3个角色 + 34个字段 + 13个表单 + 表1的5条数据
   * 字段：10主键 + 10整数 + 10字符 + 4属性字段
   * 表单：10个基础表 + 3个属性表（一级整数、一级字符、二级属性）
   */
  async buildTestEnvironment() {
    console.log('开始搭建测试环境...');
    
    try {
      // 1. 创建项目
      const project = await this.createTestProject();
      console.log('✓ 项目创建成功:', project.id);
      
      // 2. 创建角色
      await this.createTestRoles(project.id);
      console.log('✓ 角色创建成功');
      
      // 3. 创建字段
      const fields = await this.createTestFields(project.id);
      console.log('✓ 字段创建成功:', fields.length, '个');
      
      // 4. 创建表单
      const forms = await this.createTestForms(project.id, fields);
      console.log('✓ 表单创建成功:', forms.length, '个');
      
      // 5. 为表1添加测试数据
      await this.createTestData(project.id, forms[0]);
      console.log('✓ 测试数据创建成功');
      
      console.log('=============================');
      console.log('测试环境搭建完成！');
      console.log('项目ID:', project.id);
      console.log('=============================');
      
      return project;
    } catch (error) {
      console.error('搭建测试环境失败:', error);
      throw error;
    }
  },

  /**
   * 创建测试项目
   */
  async createTestProject() {
    const project = {
      name: '测试项目',
      status: '开发阶段'
    };
    
    // addProject 会返回带有数据库生成的UUID的项目对象
    const createdProject = await window.dndDB.addProject(project);
    return createdProject;  // 返回包含正确ID的项目
  },

  /**
   * 创建测试角色（3个）
   */
  async createTestRoles(projectId) {
    const roleNames = ['测试角色1', '测试角色2', '测试角色3'];
    const roles = [];
    
    for (const name of roleNames) {
      const role = await window.dndDB.addRole(projectId, { name });
      roles.push(role);
    }
    
    return roles;
  },

  /**
   * 创建测试字段（34个）
   * - 10个主键字段：主键1-10
   * - 10个整数字段：整数1-10
   * - 10个字符字段：字符1-10
   * - 4个属性字段：整数属性1-2, 字符属性1-2
   */
  async createTestFields(projectId) {
    const fields = [];
    
    // 获取第一个角色ID（字段需要关联角色）
    const project = await window.dndDB.getProjectById(projectId);
    const roleId = project.roles[0]?.id;
    
    if (!roleId) {
      throw new Error('找不到角色，请先创建角色');
    }
    
    // 创建10个主键字段
    for (let i = 1; i <= 10; i++) {
      const field = await window.dndDB.addField(projectId, {
        name: `主键${i}`,
        roleId: roleId,
        role: '主键',          // 修正：应该是 '主键' 而不是 '主键字段'
        type: '整数',          // 修正：主键应该是整数类型
        nature: '基础字段'
      });
      fields.push(field);
    }
    
    // 创建10个整数字段
    for (let i = 1; i <= 10; i++) {
      const field = await window.dndDB.addField(projectId, {
        name: `整数${i}`,
        roleId: roleId,
        role: '非主键',        // 修正：应该是 '非主键' 而不是 '非主键字段'
        type: '整数',
        nature: '基础字段'
      });
      fields.push(field);
    }
    
    // 创建10个字符字段
    for (let i = 1; i <= 10; i++) {
      const field = await window.dndDB.addField(projectId, {
        name: `字符${i}`,
        roleId: roleId,
        role: '非主键',        // 修正：应该是 '非主键' 而不是 '非主键字段'
        type: '字符串',
        nature: '基础字段'
      });
      fields.push(field);
    }
    
    // 创建4个属性字段（用于属性表）
    // 整数属性1, 整数属性2
    for (let i = 1; i <= 2; i++) {
      const field = await window.dndDB.addField(projectId, {
        name: `整数属性${i}`,
        roleId: roleId,
        role: '非主键',
        type: '整数',
        nature: '属性字段'      // 修正：属性字段
      });
      fields.push(field);
    }
    
    // 字符属性1, 字符属性2
    for (let i = 1; i <= 2; i++) {
      const field = await window.dndDB.addField(projectId, {
        name: `字符属性${i}`,
        roleId: roleId,
        role: '非主键',
        type: '字符串',
        nature: '属性字段'      // 修正：属性字段
      });
      fields.push(field);
    }
    
    return fields;
  },

  /**
   * 创建测试表单（10个基础表 + 3个属性表）
   * 表1-表10，每个表单包含：1个主键 + 1个整数 + 1个字符
   * 一级整数属性表：主键----整数属性1
   * 一级字符属性表：主键----字符属性1
   * 二级属性表：一级----整数属性2，二级----字符属性2
   */
  async createTestForms(projectId, fields) {
    const forms = [];
    
    // 按名称分组字段
    const pkFields = fields.filter(f => f.name.startsWith('主键'));
    const intFields = fields.filter(f => f.name.startsWith('整数') && !f.name.includes('属性'));
    const strFields = fields.filter(f => f.name.startsWith('字符') && !f.name.includes('属性'));
    
    // 属性字段
    const intAttrFields = fields.filter(f => f.name.startsWith('整数属性'));
    const strAttrFields = fields.filter(f => f.name.startsWith('字符属性'));
    
    // 创建10个基础表单
    for (let i = 1; i <= 10; i++) {
      const pkField = pkFields[i - 1];
      const intField = intFields[i - 1];
      const strField = strFields[i - 1];
      
      // 创建表单 - 结构格式必须与IndependentBaseForm一致
      const form = await window.dndDB.addForm(projectId, {
        name: `表${i}`,
        category: '对象表',
        type: '对象表单',
        subType: '独立基础表',
        formNature: '基础表单',
        structure: {
          primaryKey: pkField.id,  // 正确：使用 primaryKey 而不是 primaryKeyField
          fields: [
            // 主键字段
            { fieldId: pkField.id, required: true, isPrimaryKey: true },
            // 整数字段
            { fieldId: intField.id, required: false, isPrimaryKey: false },
            // 字符字段
            { fieldId: strField.id, required: false, isPrimaryKey: false }
          ]
        },
        displayOrder: i
      });
      
      forms.push(form);
    }
    
    // 创建一级整数属性表（主键----整数属性1）
    const intAttr1Field = intAttrFields[0];  // 整数属性1
    const intAttrForm = await window.dndDB.addForm(projectId, {
      name: '一级整数属性表',
      category: '属性表',
      type: '属性表单',
      subType: '属性表',
      formNature: '属性表单',
      structure: {
        levels: 1,
        levelFields: [
          { level: 1, fieldId: intAttr1Field.id }
        ]
      },
      displayOrder: 11
    });
    forms.push(intAttrForm);
    
    // 创建一级字符属性表（主键----字符属性1）
    const strAttr1Field = strAttrFields[0];  // 字符属性1
    const strAttrForm = await window.dndDB.addForm(projectId, {
      name: '一级字符属性表',
      category: '属性表',
      type: '属性表单',
      subType: '属性表',
      formNature: '属性表单',
      structure: {
        levels: 1,
        levelFields: [
          { level: 1, fieldId: strAttr1Field.id }
        ]
      },
      displayOrder: 12
    });
    forms.push(strAttrForm);
    
    // 创建二级属性表（一级----整数属性2，二级----字符属性2）
    const intAttr2Field = intAttrFields[1];  // 整数属性2
    const strAttr2Field = strAttrFields[1];  // 字符属性2
    const twoLevelAttrForm = await window.dndDB.addForm(projectId, {
      name: '二级属性表',
      category: '属性表',
      type: '属性表单',
      subType: '属性表',
      formNature: '属性表单',
      structure: {
        levels: 2,
        levelFields: [
          { level: 1, fieldId: intAttr2Field.id },
          { level: 2, fieldId: strAttr2Field.id }
        ]
      },
      displayOrder: 13
    });
    forms.push(twoLevelAttrForm);
    
    return forms;
  },

  /**
   * 为表1创建测试数据（5条）
   */
  async createTestData(projectId, form) {
    console.log('开始创建测试数据...');
    console.log('表单信息:', { id: form.id, name: form.name });
    
    if (!form || !form.structure || !form.structure.fields) {
      console.error('表单结构无效:', form);
      throw new Error('表单结构无效');
    }
    
    // 获取表单的字段定义 - 使用 fieldId 属性
    const structureFields = form.structure.fields;
    const pkFieldId = structureFields[0].fieldId;  // 主键1
    const intFieldId = structureFields[1].fieldId; // 整数1
    const strFieldId = structureFields[2].fieldId; // 字符1
    
    console.log('字段ID:', { pkFieldId, intFieldId, strFieldId });
    
    // 创建5条测试数据
    const testData = [
      { [pkFieldId]: 1, [intFieldId]: 1, [strFieldId]: 'A1' },
      { [pkFieldId]: 2, [intFieldId]: 2, [strFieldId]: 'A2' },
      { [pkFieldId]: 3, [intFieldId]: 3, [strFieldId]: 'A3' },
      { [pkFieldId]: 4, [intFieldId]: 4, [strFieldId]: 'A4' },
      { [pkFieldId]: 5, [intFieldId]: 5, [strFieldId]: 'A5' }
    ];
    
    console.log('准备添加的测试数据:', testData);
    
    for (let i = 0; i < testData.length; i++) {
      const data = testData[i];
      console.log(`添加第 ${i + 1} 条数据:`, data);
      try {
        const result = await window.dndDB.addFormData(projectId, form.id, data);
        console.log(`第 ${i + 1} 条数据添加成功:`, result);
      } catch (error) {
        console.error(`第 ${i + 1} 条数据添加失败:`, error);
        throw error;
      }
    }
    
    // 验证数据是否添加成功
    const savedData = await window.dndDB.getFormDataList(projectId, form.id);
    console.log('验证：已保存的数据条数:', savedData.length);
    
    return testData;
  },

  /**
   * 检查是否已存在测试项目
   */
  async hasTestProject() {
    const projects = await window.dndDB.getAllProjects();
    return projects.some(p => p.name === '测试项目');
  }
};
