"""added_endre_rapportfrist_arsak

Revision ID: 4ad6e143f70a
Revises: 51672d934ef9
Create Date: 2014-10-27 15:01:13.631958

"""

# revision identifiers, used by Alembic.
revision = '4ad6e143f70a'
down_revision = '51672d934ef9'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('vedtak', sa.Column('endre_rapportfrist_arsak', sa.String(length=150), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('vedtak', 'endre_rapportfrist_arsak')
    ### end Alembic commands ###