import { evaluate } from 'mathjs';
import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function App() {
  const [input, setInput] = useState('');

  // Constants mapping
  const constants = {
    'π': 'pi',
    'K': '9 * 10^9',
    'h': '6.626 * 10^-34',
    'c': '3 * 10^8',
  };

  const formatScientific = (num) => {
    if (num === 0) return '0';
    const exponent = Math.floor(Math.log10(Math.abs(num)));
    const mantissa = num / Math.pow(10, exponent);
    return `${mantissa.toFixed(6)} x 10^${exponent}`;
  };

  // Preprocess input: handle implicit multiplication and replace constants
  const preprocessInput = (str) => {
    let processed = str;

    // Replace constants with mathjs equivalents or values
    for (const [symbol, value] of Object.entries(constants)) {
      const regex = new RegExp(symbol, 'g');
      processed = processed.replace(regex, `(${value})`);
    }

    // Insert * where implicit multiplication is likely intended
    // e.g., 2( → 2*(, )(3 → )*(3, 2π → 2*π
    processed = processed
      .replace(/(\d)(\()/g, '$1*(')     // 2( → 2*(
      .replace(/(\))(\d)/g, '$1*$2')    // )2 → )*2
      .replace(/(\d)([a-zA-Z])/g, '$1*$2') // 2π → 2*π
      .replace(/([a-zA-Z])(\d)/g, '$1*$2') // π2 → π*2
      .replace(/(\))([a-zA-Z])/g, '$1*$2') // )π → )*π
      .replace(/√(\d+(\.\d+)?|\([^)]+\))/g, (match: any, group: any) => {
        return `sqrt(${group})`
      })

    return processed;
  };

  const handlePress = (value) => {
    setInput((prev) => {
      if (value === ')') {
        const opening = (prev.match(/\(/g) || []).length;
        const closing = (prev.match(/\)/g) || []).length;

        // Only allow closing bracket if it won't unbalance the expression
        if (closing >= opening) return prev;
      }
      return prev + value;
    });
  };

  const handleClear = () => setInput('');

  const handleBackspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleEvaluate = () => {
    try {
      const processed = preprocessInput(input);
      const result = evaluate(processed);
      setInput(formatScientific(result));
    } catch {
      setInput('Error');
    }
  };

  const renderButton = (label, onPress: () => void, style = {}) => (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );

  const minFontSize = 20;
  const maxFontSize = 36;
  const dynamicFontSize = Math.max(minFontSize, maxFontSize - input.length * 1.2);

  const renderColoredExpression = (expression) => {
    const colors = ['#ff6f61', '#6a5acd', '#00bcd4', '#f4c20d']; // cycle through
    let depth = 0;

    return expression.split('').map((char, index) => {
      if (char === '(') {
        const color = colors[depth % colors.length];
        depth++;
        return <Text key={index} style={{ color }}>{char}</Text>;
      } else if (char === ')') {
        depth = Math.max(depth - 1, 0);
        const color = colors[depth % colors.length];
        return <Text key={index} style={{ color }}>{char}</Text>;
      } else {
        return <Text key={index}>{char}</Text>;
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calculatorBox}>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <ScrollView
              style={[styles.input]}
              horizontal
              contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}
            >
              <Text style={[styles.inputText, { fontSize: dynamicFontSize }]}>
                {renderColoredExpression(input)}
              </Text>
            </ScrollView>
          </View>
          <TouchableOpacity style={styles.backspaceButton} onPress={handleBackspace}>
            <Text style={styles.buttonText}>⌫</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          {renderButton('π', () => handlePress('π'))}
          {renderButton('K', () => handlePress('K'))}
          {renderButton('h', () => handlePress('h'))}
          {renderButton('c', () => handlePress('c'))}
        </View>

        <View style={styles.buttonGrid}>
          {[
            ['(', ')', '⌫', '/'],
            ['7', '8', '9', '*'],
            ['4', '5', '6', '-'],
            ['1', '2', '3', '+'],
            ['0', '.', '^', '√'],
          ].map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((item) => {
                if (item === '=') return renderButton(item, handleEvaluate, styles.equalsButton);
                if (item === '⌫') return renderButton(item, handleBackspace);
                return renderButton(item, () => handlePress(item));
              })}
            </View>
          ))}
          <View style={styles.row}>
            {renderButton('C', handleClear, styles.clearButton)}
            {renderButton('=', handleEvaluate, styles.equalsButton)}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorBox: {
    width: '95%',
    maxWidth: 400,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
  },
  input: {
    height: 80,
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    fontSize: 36,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 24,
    textAlign: 'right',
  },
  buttonGrid: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  button: {
    flex: 1,
    backgroundColor: '#333',
    marginHorizontal: 6,
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
  },
  equalsButton: {
    backgroundColor: '#4e9bde',
  },
  clearButton: {
    backgroundColor: '#e76f51',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flex: 1,
  },
  backspaceButton: {
    backgroundColor: '#555',
    height: 50,
    width: 60,
    marginLeft: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputText: {
    color: '#ffffff',
    textAlign: 'right',
    minWidth: '100%',
  },
});
