package org.motorica.telemetry.ga.mobile;

import org.matrix.androidsdk.rest.model.Message;

class Messages {
    static class MotoricaMechanicalMessage extends Message {
        public double timestamp;
        public int power;
    }
}
