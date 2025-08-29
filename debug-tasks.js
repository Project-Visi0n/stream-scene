#!/usr/bin/env node

/**
 * Debug script to test task creation and notifications
 */

import fetch from 'node-fetch';

async function debugTaskSystem() {
  console.log('🐛 Debugging Task System...\n');

  const baseUrl = 'http://localhost:8000';
  
  try {
    // 1. Test authentication status
    console.log('1. Testing authentication status...');
    const authResponse = await fetch(`${baseUrl}/auth/user`, {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log(`   Auth Status: ${authResponse.status}`);
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log(`   Authenticated: ${authData.authenticated}`);
      console.log(`   User: ${authData.user ? authData.user.email || authData.user.id : 'None'}\n`);
    } else {
      console.log('   User not authenticated\n');
    }

    // 2. Test task endpoint accessibility
    console.log('2. Testing task endpoint...');
    const taskResponse = await fetch(`${baseUrl}/tasks`, {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log(`   Tasks Endpoint Status: ${taskResponse.status}`);
    if (taskResponse.ok) {
      const tasks = await taskResponse.json();
      console.log(`   Current Tasks: ${Array.isArray(tasks) ? tasks.length : 'Unknown format'}`);
    } else {
      const errorText = await taskResponse.text();
      console.log(`   Error: ${errorText}\n`);
    }

    // 3. Test task creation (only if authenticated)
    if (authResponse.ok) {
      console.log('\n3. Testing task creation...');
      const testTask = {
        title: 'Debug Test Task',
        description: 'This is a test task created by the debug script',
        priority: 'medium',
        task_type: 'admin',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        estimated_hours: 2
      };

      const createResponse = await fetch(`${baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(testTask)
      });

      console.log(`   Create Task Status: ${createResponse.status}`);
      if (createResponse.ok) {
        const newTask = await createResponse.json();
        console.log(`   ✅ Task created successfully! ID: ${newTask.id}`);
        console.log('   📝 This should trigger a success notification in the UI');
      } else {
        const errorText = await createResponse.text();
        console.log(`   ❌ Task creation failed: ${errorText}`);
        console.log('   📝 This should trigger an error notification in the UI');
      }
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('   - If authenticated but no notifications appear, check browser console');
  console.log('   - If not authenticated, log in through Google button first');
  console.log('   - Check Network tab to see if requests are being made');
  console.log('   - Notifications should appear at the top of the AI Weekly Planner');
}

debugTaskSystem().catch(console.error);
